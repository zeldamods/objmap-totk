import 'leaflet-path-transform';

import * as L from 'leaflet';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import AppMapDetailsBase from '@/components/AppMapDetailsBase';
import ObjectInfo from '@/components/ObjectInfo';
import ShopData from '@/components/ShopData';
import {
  MapMarkerObj,
  MapMarkerSearchResult,
} from '@/MapMarker';
import {
  AiGroup,
  MapMgr,
  ObjectData,
  ObjectMinData,
  parseHash,
} from '@/services/MapMgr';
import { MsgMgr } from '@/services/MsgMgr';
import { ColorScale } from '@/util/colorscale';
import * as curves from '@/util/curves';
import { vecAdd } from '@/util/math';
import * as svg from '@/util/svg';

require('leaflet-hotline')

const KUH_TAKKAR_ELEVATOR_HASH_ID = 0x96d181a0;
const DRAGON_HASH_IDS = [
  0x4fb21727, // Farosh
  0xc119deb6, // Farosh Far
  0x54d56291, // Dinraal
  0xfc79f706, // Dinraal Far
  0xe61a0932, // Naydra
  0x86b9a466, // Naydra Far
];

const rock_target = ["Obj_LiftRockWhite_Korok_A_01", "Obj_LiftRockGerudo_Korok_A_01", "Obj_LiftRockEldin_Korok_A_01"];
const rock_source = ["Obj_LiftRockWhite_A_01", "Obj_LiftRockGerudo_A_01", "Obj_LiftRockEldin_A_01"];

function numOrArrayToArray(x: number | [number, number, number] | undefined): [number, number, number] | undefined {
  return typeof x == 'number' ? [x, x, x] : x;
}

function isAreaObject(obj: ObjectMinData) {
  const areaObjectNames = ["Area", "BoxWater", "SpotBgmTag", "PointWindSetTag", "AreaCulling", "AreaCulling_InnerHide",
    "AreaCulling_InnerOn", "AreaCulling_OuterNPCMementary", "FarModelCullingArea", 'LocationArea',
    'LowGravityAreaBox', 'LowGravityAreaCylinder'
  ];
  return areaObjectNames.includes(obj.name) || obj.name.startsWith('AirWall');
}

class StaticData {
  persistentAreaMarkers: L.Path[] = [];
  history: ObjectData[] = [];
  persistentKorokMarkers: any[] = [];
  colorScale: ColorScale | null = null;
  persistentRailMarkers: { [key: string]: any }[] = [];
  persistentRailLimits: { [key: string]: any } = {};
}

const staticData = new StaticData();

@Component({
  components: {
    ObjectInfo,
    ShopData,
  },
})
export default class AppMapDetailsObj extends AppMapDetailsBase<MapMarkerObj | MapMarkerSearchResult> {
  private minObj: ObjectMinData | null = null;
  private obj: ObjectData | null = null;

  private aiGroups: AiGroup[] = [];

  private genGroup: ObjectData[] = [];
  private genGroupSet: Map<string, ObjectData> = new Map();

  private dropTables: { [key: string]: any } = {};
  private shopData: { [key: string]: any } = {};

  private areaMarkers: L.Path[] = [];
  private staticData = staticData;

  private korokMarkers: any[] = [];

  rails: { [key: string]: any }[] = [];
  railsWithMarkers: { [key: string]: any }[] = [];
  private railMarkers: L.Polyline[] = [];
  private railLimits: { [key: string]: any } = {};
  selectedRailIdx = -1;

  @Prop({ type: Boolean, default: false })
  private isChecked!: boolean;

  async init() {
    this.minObj = this.marker.data.obj;
    this.obj = null;
    this.genGroup = [];
    this.genGroupSet.clear();
    this.aiGroups = [];
    this.dropTables = {};
    this.areaMarkers.forEach(m => m.remove());
    this.areaMarkers = [];
    this.rails = [];
    this.railMarkers.forEach(m => m.remove());
    this.railMarkers = [];
    this.railsWithMarkers = [];
    this.selectedRailIdx = -1;
    this.shopData = {};
    if (this.minObj.objid) {
      this.obj = (await MapMgr.getInstance().getObjByObjId(this.minObj.objid))!;
    } else {
      this.obj = (await MapMgr.getInstance().getObjByHashId(this.minObj.hash_id))!;
      // Set the objid from the fetched data otherwise Vue does not update
      this.minObj.objid = this.obj.objid;
    }
    if (!this.minObj.korok_type && this.obj.korok_type) {
      this.minObj.korok_type = this.obj.korok_type;
    }
    if (!this.minObj.korok_id && this.obj.korok_id) {
      this.minObj.korok_id = this.obj.korok_id;
    }

    const dropTableName = this.getDropTableName();
    if (dropTableName) {
      this.dropTables = await MapMgr.getInstance().getObjDropTables(this.getRankedUpActorNameForObj(this.minObj), dropTableName);
    }

    this.aiGroups = await MapMgr.getInstance().getObjAiGroups(this.obj.map_type, this.obj.map_name, this.obj.hash_id);

    this.genGroup = await MapMgr.getInstance().getObjGenGroup(this.obj.map_type, this.obj.map_name, this.obj.hash_id);
    for (const obj of this.genGroup) {
      this.genGroupSet.set(obj.hash_id, obj);
    }

    const location = this.getLocationSub();
    if (location != '') {
      if (location.includes('Stable') || location == "Oasis") {
        this.shopData = await MapMgr.getInstance().getObjShopData();
      }
    }

    if (this.obj.data.Rails) {
      this.rails = await MapMgr.getInstance().getObjRails(this.obj.hash_id) || [];
    }

    this.initAreaMarkers();

    this.marker.data.mb.m.on('ColorScale:change', async (args: any) => {
      this.updateColorlineStyle({ palette: args.palette });
    });

    this.korokMarkers.forEach(m => m.remove());
    this.korokMarkers = [];
    this.initKorokMarkers();
    this.initRails();
  }

  mounted() {
    this.$on('AppMap:update-search-markers', (value: any) => {
      this.$parent.$emit('AppMap:update-search-markers', value);
    });
  }

  initRails() {
    if (!this.obj)
      return;

    if (this.obj.korok_type && this.obj.korok_type == "Moving Lights")
      return;

    let palette = (this.staticData.colorScale) ? this.staticData.colorScale.palette() : {
      0: 'pink', 1: 'white'
    };
    let opts = {
      min: 0, max: 800,
      palette: palette,
      weight: 4,
      outlineWidth: 0,
      palettes: {
        sunset: {
          0.0000: '#f3e79b', 0.1666: '#fac484', 0.3333: '#f8a07e', 0.5000: '#eb7f86',
          0.6666: '#ce6693', 0.8333: '#a059a0', 1.0000: '#5c53a5'
        }
      },
      name: "sunset",
      pane: 'tilePane',
    };

    let map = this.marker.data.mb;

    this.railLimits = {};

    for (const rail of this.rails) {
      let pts = curves.railPath(rail); //[x,y,z] y is UpDown
      if (pts.length == 0) {
        continue;
      }

      let yvals = pts.map((pt: any) => pt[1]);
      if (this.railLimits.min === undefined) { this.railLimits.min = yvals[0]; }
      if (this.railLimits.max === undefined) { this.railLimits.max = yvals[0]; }
      this.railLimits.min = Math.min(this.railLimits.min, ...yvals);
      this.railLimits.max = Math.max(this.railLimits.max, ...yvals);
      if (this.railLimits.max - this.railLimits.min < 1e-3) {
        this.railLimits.min = this.railLimits.max - 5;
        this.railLimits.max = this.railLimits.max + 5;
      }
      // Draw polyline [x,z,y] but z is North-South and y is Up-Down
      pts = pts.map((pt: any) => [pt[2], pt[0], pt[1]]);

      this.railsWithMarkers.push(rail);
      // @ts-ignore
      this.railMarkers.push(L.hotline(pts, opts).addTo(map.m));
    }

    if (this.railMarkers.length) {
      if (!this.staticData.colorScale) {
        this.staticData.colorScale = new ColorScale(opts, { position: 'bottomleft' }).addTo(map.m);
        this.updateColorlineStyle({ palette: this.staticData.colorScale.palette() });
      }
      this.updateColorScale();
    }
  }

  updateColorlineStyle(style: any) {
    this.staticData.persistentRailMarkers.forEach((line: any) => {
      line.setStyle(style).redraw();
    });
    this.railMarkers.forEach((line: any) => {
      line.setStyle(style).redraw();
    });
  }

  getColorlineLimits(): any | null {
    let prl = this.staticData.persistentRailLimits;
    // Min/Max, filter out undefined
    //   if all are undefined, return infinity/-infinity
    let amin = Math.min(...[prl.min, this.railLimits.min].filter(isFinite));
    let amax = Math.max(...[prl.max, this.railLimits.max].filter(isFinite));
    if (!isFinite(amin) || !isFinite(amax)) {
      return null;
    }
    return { min: amin, max: amax };
  }

  setColorlineLimits(limits: any) {
    this.updateColorlineStyle(limits);
    if (this.staticData.colorScale) {
      this.staticData.colorScale.minmax(limits.min, limits.max);
    }
  }

  updateColorScale() {
    let limits = this.getColorlineLimits();
    if (limits) {
      this.setColorlineLimits(limits);
    }
  }

  beforeDestroy() {
    this.areaMarkers.forEach(m => m.remove());
    this.korokMarkers.forEach(m => m.remove());
    this.railMarkers.forEach(m => m.remove());
    // Rails
    this.railLimits = {};
    this.updateColorScale();
    if (!this.staticData.persistentRailMarkers.length) {
      this.forgetColorScale();
    }
  }

  getLocationSub() {
    const obj = this.marker.data.obj;
    if ((obj.name === 'LocationMarker' || obj.name == 'LocationArea') && obj.Location) {
      const locationName = MsgMgr.getInstance().getMsgWithFile('StaticMsg/LocationMarker', obj.Location)
        || MsgMgr.getInstance().getMsgWithFile('StaticMsg/Dungeon', obj.Location);
      return locationName;
    }
    return '';
  }

  isSearchResult() {
    return this.marker.data instanceof MapMarkerSearchResult;
  }

  emitBackToSearch() {
    this.$parent.$emit('AppMap:switch-pane', 'spane-search');
  }

  jumpToObj(obj: ObjectData, updateHistory = true) {
    if (updateHistory && this.obj)
      this.staticData.history.push(this.obj);
    this.$parent.$emit('AppMap:open-obj', obj);
  }

  goBack() {
    this.jumpToObj(this.staticData.history.pop()!, false);
  }

  arrayOrNumToStr(d: number[] | number, digits: number) {
    if (d == null)
      return '';
    if (Array.isArray(d))
      return d.map(x => x.toFixed(digits)).join(', ');
    return d.toFixed(digits);
  }

  private initAreaMarkers() {
    if (!this.obj)
      return;

    if (this.obj.name === "AreaCulling") {
      this.addAreaCullingMarker(this.obj);
      return;
    }

    if (isAreaObject(this.obj))
      this.addAreaMarker(this.obj);

    if (this.obj.name == 'LocationTag') {
      this.genGroup.filter(isAreaObject).forEach((o) => {
        this.addAreaMarker(o);
      });
    }
  }

  private addAreaMarker(obj: ObjectData) {
    const shapes = ['Sphere', 'Capsule', 'Box', 'Cylinder'];
    const mb = this.marker.data.mb;
    const [x, y, z] = obj.data.Translate;
    const dyn = obj.data.Dynamic;
    let shapeNum = (dyn && dyn.RigidBodyShapeType !== undefined) ? dyn.RigidBodyShapeType : 2;
    if (obj.name == 'LowGravityAreaCylinder')
      shapeNum = 3;
    if (obj.name == 'LowGravityAreaBox')
      shapeNum = 2;
    const shape = (shapeNum <= 3) ? shapes[shapeNum] : shapes[2];
    const scale = numOrArrayToArray(obj.data.Scale);
    const rotate = numOrArrayToArray(obj.data.Rotate);

    if (!scale)
      return;

    let areaMarker: L.Path;
    // Super rough approximation. This could be improved by actually projecting the 3D shape...
    // A lot of shapes do not use any rotate feature though,
    // and for those this naïve approach should suffice.
    if (shape == 'Sphere') {
      areaMarker = L.circle(mb.fromXYZ([x, 0, z]), { radius: scale[0] }).addTo(mb.m);
    } else if (shape == 'Cylinder' || shape == 'Capsule') {
      if (rotate && Math.abs(rotate[0] - 1.57080) <= 0.01) {
        const southWest = L.latLng(z + scale[2], x - scale[1] - scale[2]);
        const northEast = L.latLng(z - scale[2], x + scale[1] + scale[2]);
        areaMarker = L.rectangle(L.latLngBounds(southWest, northEast)).addTo(mb.m);
      } else {
        areaMarker = L.circle(mb.fromXYZ([x, 0, z]), { radius: scale[0] }).addTo(mb.m);
      }
    } else if (shape == 'Box') {
      this.addBoxAreaMarker(obj, scale);
      return;
    } else if (shape == 'Hull') {
      // Deliberately unhandled.
      return;
    } else {
      return;
    }

    areaMarker.bringToBack();
    this.areaMarkers.push(areaMarker);
  }

  private addAreaCullingMarker(obj: ObjectData) {
    const scale = numOrArrayToArray(obj.data.Scale);
    if (!scale)
      return;

    const dyn = obj.data.Dynamic;
    if (!dyn)
      return;

    const MarginNegative = dyn.MarginNegative;
    if (!MarginNegative)
      return;

    const MarginPositive = dyn.MarginPositive;
    if (!MarginPositive)
      return;

    this.addBoxAreaMarker(obj, scale, "AreaCulling", { fillColor: "blue" });
    this.addBoxAreaMarker(obj, vecAdd(scale, MarginPositive), "AreaCulling + MarginPositive", { fillColor: "green", color: "green" });
    this.addBoxAreaMarker(obj, vecAdd(scale, MarginNegative), "AreaCulling + MarginNegative", { fillColor: "red", color: "red" });
  }

  private addBoxAreaMarker(obj: ObjectData, scale: [number, number, number], tooltip?: string, options: L.PolylineOptions = {}): L.Path {
    const mb = this.marker.data.mb;
    const [x, _, z] = obj.data.Translate;
    const rotate = numOrArrayToArray(obj.data.Rotate);

    // Super rough approximation. This could be improved by actually projecting the 3D shape...
    // A lot of shapes do not use any rotate feature though,
    // and for those this naïve approach should suffice.
    const southWest = L.latLng(z + scale[2], x - scale[0]);
    const northEast = L.latLng(z - scale[2], x + scale[0]);
    const marker = L.rectangle(L.latLngBounds(southWest, northEast), {
      ...options,
      // @ts-ignore
      transform: true,
    }).addTo(mb.m);

    if (tooltip) {
      marker.bindTooltip(tooltip);
    }

    if (rotate) {
      // XXX: horrible hack to rotate a rectangle.
      // @ts-ignore
      marker.transform._map = marker._map;
      const center = (<L.Rectangle>(marker)).getCenter();
      // @ts-ignore
      marker.transform._transformPoints(marker, -rotate[1], null, center, center);
    }

    marker.bringToBack();
    this.areaMarkers.push(marker);
    return marker;
  }

  isAreaReprPossiblyWrong(): boolean {
    if (!this.obj || !isAreaObject(this.obj))
      return false;

    // TODO: check object shape correctly
    return true;
  }

  keepAreaMarkersAlive() {
    this.staticData.persistentAreaMarkers.push(...this.areaMarkers);
    this.areaMarkers = [];
  }

  forgetPersistentAreaMarkers() {
    this.areaMarkers.length = this.areaMarkers.length;
    this.staticData.persistentAreaMarkers.forEach(m => m.remove());
    this.staticData.persistentAreaMarkers = [];
  }

  forgetColorScale() {
    if (this.staticData.colorScale) {
      this.staticData.colorScale.remove();
      this.staticData.colorScale = null;
    }
  }


  static getName(name: string) {
    return MsgMgr.getInstance().getName(name) || name;
  }

  dropTableExists() {
    return Object.keys(this.dropTables).length > 0;
  }

  getDropTableName() {
    if (!this.obj || !this.obj.drop || this.obj.drop.type != "Table")
      return null;
    return this.obj.drop.value[0];
  }

  shopDataExists() {
    return Object.keys(this.shopData).length > 0;
  }

  getDropTableGroupCount(group: any) {
    const min_drop = group.MinNumberOfDropChance;
    const max_drop = group.MaxNumberOfDropChance;
    let num = "1";
    if (min_drop && max_drop) {
      if (min_drop != max_drop) {
        num = `${min_drop} - ${max_drop}`;
      } else {
        num = `${min_drop}`;
      }
    } else if (max_drop && max_drop != 1) {
      num = `1 - ${max_drop}`;
    } else if (min_drop) {
      num = `${min_drop}`;
    }
    return `Items: ${num}`;
  }

  findItemByHash(group: any[], links: any[], name: string): any {
    let hashes = links.map(link => link.DestUnitHashId);
    let out = group.find(g => g.data.UnitConfigName == name && hashes.includes(g.hash_id));
    return (out) ? out : null;
  }

  getNextFlowerInKorokFlowerTrail(group: any[], flower: any): any {
    let or = this.findItemByHash(group, flower.data.LinksToObj, "LinkTagOr");
    if (!or) {
      return null;
    }
    let lag = this.findItemByHash(group, or.data.LinksToObj, "SwitchTimeLag");
    if (!lag) {
      return null;
    }
    let and = this.findItemByHash(group, lag.data.LinksToObj, "LinkTagAnd");
    if (!and) {
      return null;
    }
    let plant = this.findItemByHash(group, and.data.LinksToObj, "Obj_Plant_Korok_A_01");
    return plant;
  }

  isLastFlowerInKorokFlowerTrail(flower: any): boolean {
    return flower.data['!Parameters'].IsLastKorokFlower;
  }

  getFlowersInKorokFlowerTrail(group: any[], flower: any): any[] {
    let flowers = [flower];
    while (flower && !this.isLastFlowerInKorokFlowerTrail(flower)) {
      let f = this.getNextFlowerInKorokFlowerTrail(group, flower);
      flowers.push(f);
      flower = f;
    }
    return flowers;
  }

  getKorokIcon(obj_name: string, style: string = "", text: string = ""): L.DivIcon | L.Icon {
    let html = "";
    let className = "";
    if (obj_name == "FldObj_KorokStartingBlock_A_01") {
      html = '<div class="stump"><i class="fa fa-leaf big-leaf"></i></div>';
    } else if (obj_name == "FldObj_KorokGoal_A_01") {
      html = svg.raceGoal;
    } else if (obj_name == "Obj_Plant_Korok_A_01") {
      html = `<div><i class="fa fa-leaf korokicon" style="${style}"></i>${text}</div>`;
    } else if (rock_target.includes(obj_name)) {
      html = '<i class="fa fa-bullseye" style="font-size: 1.6em; color: rgba(255,255,255,0.6);"></i>';
    } else if (rock_source.includes(obj_name)) {
      html = '<i class="fa fa-cloud" style="font-size: 1.6em; color: #bbb; text-shadow: black 0px 0px 3px; "></i>';
    } else if (obj_name == "KorokCarryPassenger_Pair" || obj_name == "KorokCarry_Destination") {
      if (style == "smoke") {
        const w = 35;
        const h = w * 1.43;
        return L.icon({ iconUrl: '/icons/smoke.svg', iconSize: [w, h], iconAnchor: [w / 2, h] });
      }
      return L.icon({ iconUrl: '/icons/mapicon_korok.png', iconSize: [20, 20], iconAnchor: [10, 10] });
    }
    return L.divIcon({
      html: html, className: className, iconSize: [30, 30], iconAnchor: [15, 15],
    });
  }

  getKorokMarkerWithIcon(obj: any, style: string = "", text: string = "") {
    let icon = this.getKorokIcon(obj.name, style, text);
    return L.marker([obj.data.Translate[2], obj.data.Translate[0]], { icon: icon });
  }

  initKorokMarkers() {
    if (!this.obj)
      return;
    const use_icon = true;
    let map = this.marker.data.mb;
    if (this.obj.korok_type == "Goal Ring (Race)") {
      let names = ["FldObj_KorokStartingBlock_A_01", "FldObj_KorokGoal_A_01"];
      let objs = this.genGroup.filter((obj: any) => names.includes(this.getName(obj.name)));
      // Start and End Markers
      let markers = objs.map((obj: any) => this.getKorokMarkerWithIcon(obj).addTo(map.m));
      this.korokMarkers.push(...markers);

      // Connecting Line
      let ll = objs.map((obj: any) => [obj.data.Translate[2], obj.data.Translate[0]]);
      let line = L.polyline(ll, { color: '#cccccc', weight: 1.5 }).addTo(map.m);
      this.korokMarkers.push(line);
    } else if (this.obj.korok_type == "Moving Lights") {
      this.rails.forEach((rail: any) => {
        let pts = curves.railPath(rail).map((pt: any) => [pt[2], pt[0]]);
        let line = L.polyline(pts, { color: "#cccccc", weight: 2.0 }).addTo(map.m);
        this.korokMarkers.push(line);
      });
    } else if (this.obj.korok_type == "Rock Pattern") {
      const rocks = [...rock_target, ...rock_source];
      let objs = this.genGroup.filter((obj: any) => rocks.includes(this.getName(obj.name)))
      let markers = objs.map((obj: any) => this.getKorokMarkerWithIcon(obj).addTo(map.m));
      this.korokMarkers.push(...markers);
    } else if (this.obj.korok_type == "Flower Trail") {
      const is5 = this.aiGroups[0].data.Logic.includes('TrackingFlower_05');
      const is10 = this.aiGroups[0].data.Logic.includes('TrackingFlower_10');
      if (!is5 && !is10) {
        return;
      }
      // Flowers order suffixes for 5 and 10 flowers are below
      // AiGroup Instance name suffixes determine order
      //   Path of AiGroup is shared with Obj_Plant_Korok
      //   Obj_Plant_Korok hash_id points to an object within the genGroup
      const keys = (is5) ? ['29a0_37f6', '196a_cb2f', '196a_c822', '196a_9cde', '53b7_0732'] :
        ['29a0_d827', '196a_3435', '196a_994b', '196a_95b8', '196a_7ed8',
          '196a_5af9', '196a_a1d9', '196a_68c7', '196a_d26c', '53b7_e9c4'];

      let flowers = [];
      const Refs = this.aiGroups[0].data.References
      for (const key of keys) {
        let ai_flower = Refs.find((ref: any) => ref.Id == 'AiGroup' && ref.InstanceName.endsWith(key));
        if (!ai_flower)
          continue;
        let path = ai_flower.Path.split("/")[0];
        let flower = Refs.find((ref: any) => ref.Id.startsWith('Obj_Plant_Korok') && ref.Path.startsWith(path));
        if (!flower)
          continue;
        let flower_hash = '0x' + BigInt(flower.Reference).toString(16).padStart(16, '0');
        flower = this.genGroup.find((item: any) => item.hash_id == flower_hash);
        if (!flower)
          continue;
        flowers.push(flower);
      }
      if (flowers.length != keys.length) {
        return;
      }
      let style = "color: #E2DF41; font-size: 2em; display: inline;";
      let style_end = "color: #eeeeee; font-size: 2em;  display: inline;";
      flowers.forEach((obj: any, i: number) => {
        let s = (i + 1 == flowers.length) ? style_end : style;
        if (use_icon) {
          let m = this.getKorokMarkerWithIcon(obj, s, `<span style="color: #ccc; font-size: 1.2em;">${i + 1}</span>`).addTo(map.m);
          this.korokMarkers.push(m);
        } else {
          let m = L.marker([obj.data.Translate[2], obj.data.Translate[0]]).addTo(map.m);
          this.korokMarkers.push(m);
        }
      });
      let ll = flowers.map((obj: any) => {
        let x = obj.data.Translate[0];
        let z = obj.data.Translate[2];
        return [z, x];
      });
      let line = L.polyline(ll, { color: "#cccccc", weight: 1.5 }).addTo(map.m);
      this.korokMarkers.push(line);
    } else if (this.obj.name == "KorokCarryProgressKeeper" ||
      this.obj.name == "KorokCarry_Destination" ||
      this.obj.name == "KorokCarryPassenger_Pair") {
      const names: { [key: string]: any } = {
        'KorokCarry_Destination': { text: "I'm waiting here for my friend.", },
        'KorokCarryPassenger_Pair': { text: 'I need to reach my friend!' },
      }
      const objs = this.genGroup.filter(obj => obj.name in names);
      const markers = objs.map(obj =>
        this.getKorokMarkerWithIcon(obj).addTo(map.m).bindTooltip(names[obj.name].text)
      );
      this.korokMarkers.push(...markers);
      const ll = objs.map((obj: any) => { return [obj.data.Translate[2], obj.data.Translate[0]] });
      const line = L.polyline(ll, { color: '#cccccc', weight: 1.5 }).addTo(map.m);
      this.korokMarkers.push(line);
      const m = objs.filter(obj => obj.name.includes("Destination"))
        .map(obj => this.getKorokMarkerWithIcon(obj, "smoke").addTo(map.m));
      this.korokMarkers.push(...m);
    } else if (this.obj.korok_type == "Land on Target") {
      let names = ["FldObj_KorokStartingBlock_A_01", "FldObj_KorokGoalBlock_A_02"];
      let objs = this.genGroup.filter((obj: any) => names.includes(this.getName(obj.name)));
      // Start and End Markers
      let markers = objs.map((obj: any) => this.getKorokMarkerWithIcon(obj).addTo(map.m));
      this.korokMarkers.push(...markers);
      // Connecting Line
      let ll = objs.map((obj: any) => [obj.data.Translate[2], obj.data.Translate[0]]);
      let line = L.polyline(ll, { color: '#cccccc', weight: 1.5 }).addTo(map.m);
      this.korokMarkers.push(line);
    }
  }

  keepKorokMarkersAlive() {
    this.staticData.persistentKorokMarkers.push(... this.korokMarkers);
    this.korokMarkers = [];
  }

  forgetPersistentKorokMarkers() {
    let map = this.marker.data.mb;
    this.staticData.persistentKorokMarkers.forEach(m => m.remove());
    this.staticData.persistentKorokMarkers = [];
  }

  keepRailMarkersAlive() {
    this.staticData.persistentRailMarkers.push(... this.railMarkers);
    this.staticData.persistentRailLimits = this.getColorlineLimits() || {};
    this.railMarkers = [];
    this.railLimits = {};
  }

  forgetPersistentRailMarkers() {
    this.staticData.persistentRailMarkers.forEach(m => m.remove());
    this.staticData.persistentRailMarkers = [];
    this.staticData.persistentRailLimits = {};
    this.forgetColorScale();
  }

  isPossibleConditionalSpawn() {
    if (this.aiGroups.length === 0) {
      return false;
    }

    if (this.aiGroups.length !== 1) {
      // This object is in more than one AI group. This is unusual and indicates that it is
      // likely to be conditionally spawned.
      return true;
    }

    const group = this.aiGroups[0];
    if (!group.data) {
      return false;
    }

    if (group.data.Meta && group.data.Meta.includes("EnemyCampNormal")) {
      return false;
    }

    if (this.obj!.data.Presence) {
      // This is not just a "possible" conditional spawn, it is guaranteed to be one.
      // Return false because we are already going to tell the user this is a conditional spawn.
      return false;
    }

    return true;
  }

  getAiGroupReferenceName(group: AiGroup, ref: any) {
    if (ref.Reference) {
      const entity = group.referenced_entities[parseHash(ref.Reference)];
      if (entity) {
        return this.getName(entity.name);
      }
    }

    if (ref.InstanceName) {
      return "AI group: " + ref.InstanceName;
    }

    if (ref.Path) {
      return ref.Path;
    }

    if (ref.Id) {
      return ref.Id;
    }

    return "???";
  }

  onAiGroupReferenceClicked(group: AiGroup, ref: any) {
    if (!ref.Reference) {
      return;
    }

    if (parseHash(ref.Reference) == parseHash(this.obj!.hash_id)) {
      return;
    }

    const entity = group.referenced_entities[parseHash(ref.Reference)];
    if (!entity) {
      return;
    }

    this.jumpToObj(entity);
  }

  getRailUiName(rail: any): string {
    if (rail.Dynamic && rail.Dynamic.UniqueName) {
      return rail.Dynamic.UniqueName;
    }

    if (rail.Name) {
      return rail.Name;
    }

    if (rail.Gyaml) {
      return rail.Gyaml;
    }

    return "???";
  }

  onRailClicked(railIdx: number) {
    if (this.selectedRailIdx === railIdx) {
      this.deselectRail(railIdx);
    } else if (this.selectedRailIdx !== -1) {
      this.deselectRail(this.selectedRailIdx);
      this.selectRail(railIdx);
    } else {
      this.selectRail(railIdx);
    }
  }

  private selectRail(railIdx: number) {
    const marker = this.railMarkers[railIdx];
    this.selectedRailIdx = railIdx;
    this.railMarkers.forEach(m => m.remove());
    marker.addTo(this.marker.data.mb.m);
  }

  private deselectRail(railIdx: number) {
    const marker = this.railMarkers[railIdx];
    marker.remove();
    this.selectedRailIdx = -1;
    this.railMarkers.forEach(m => m.addTo(this.marker.data.mb.m));
  }
}
