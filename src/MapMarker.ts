import * as L from 'leaflet';

import { rankUpEnemyForHardMode } from '@/level_scaling';
import { MapBase } from '@/MapBase';
import * as MapIcons from '@/MapIcon';
import {
  isDefaultDropTable,
  ObjectMinData,
} from '@/services/MapMgr';
import { MsgMgr } from '@/services/MsgMgr';
import {
  CanvasMarker,
  CanvasMarkerOptions,
} from '@/util/CanvasMarker';
import * as map from '@/util/map';
import { Point } from '@/util/map';
import * as math from '@/util/math';
import { Settings } from '@/util/settings';
import * as ui from '@/util/ui';

export abstract class MapMarker {
  public title = '';
  public readonly mb: MapBase;

  constructor(mb: MapBase) {
    this.mb = mb;
  }

  abstract getMarker(): L.Marker | L.CircleMarker;
  shouldBeShown(): boolean { return true; }

  protected commonInit(): void {
    this.getMarker().on({ 'click': () => this.mb.emitMarkerSelectedEvent(this) });
  }
}

class MapMarkerImpl extends MapMarker {
  constructor(mb: MapBase, title: string, xyz: Point, options: L.MarkerOptions = {}) {
    super(mb);
    this.title = title;
    this.marker = L.marker(this.mb.fromXYZ(xyz), Object.assign(options, {
      title,
      contextmenu: true,
    }));
    super.commonInit();
  }

  getMarker() { return this.marker; }

  protected setTitle(title: string) {
    this.title = title;
    this.marker.options.title = title;
  }

  protected marker: L.Marker;
}

class MapMarkerCanvasImpl extends MapMarker {
  constructor(mb: MapBase, title: string, pos: Point, options: CanvasMarkerOptions = {}) {
    super(mb);
    this.title = title;
    let extra: any = {};
    if (options.showLabel) {
      extra['permanent'] = true;
    }
    if (options.className) {
      extra['className'] = options.className;
    }
    this.marker = new CanvasMarker(mb.fromXYZ(pos), Object.assign(options, {
      bubblingMouseEvents: false,
      contextmenu: true,
    }));
    this.marker.bindTooltip(title, { pane: 'front2', ...extra });
    super.commonInit();
  }

  getMarker() { return this.marker; }

  protected marker: L.CircleMarker;
}

class MapMarkerGenericLocationMarker extends MapMarkerImpl {
  public readonly lm: map.LocationMarker;

  private static ICONS_AND_LABELS: { [type: string]: [L.Icon, string] } = {
    'Village': [MapIcons.VILLAGE, ''],
    'Hatago': [MapIcons.HATAGO, ''],
    'Castle': [MapIcons.CASTLE, ''],
    'CheckPoint': [MapIcons.CHECKPOINT, ''],
    'Tower': [MapIcons.TOTK_TOWER, ''],
    'Labo': [MapIcons.LABO, ''],
    'Dungeon': [MapIcons.TOTK_SHRINE, ''],
    'ShopBougu': [MapIcons.SHOP_BOUGU, 'Armor Shop'],
    'ShopColor': [MapIcons.SHOP_COLOR, 'Dye Shop'],
    'ShopJewel': [MapIcons.SHOP_JEWEL, 'Jewelry Shop'],
    'ShopYadoya': [MapIcons.SHOP_YADOYA, 'Inn'],
    'ShopYorozu': [MapIcons.SHOP_YOROZU, 'General Store'],
    'Bargainer': [MapIcons.BARGAINER, 'Bargainer Status'],
    'Star': [MapIcons.STAR, ''],
    'Drink': [MapIcons.DRINK, ''],
    'Battery': [MapIcons.BATTERY, ''],
    'Dispenser': [MapIcons.DISPENSER, ''],
    'Cave': [MapIcons.CAVE, 'Cave Entrance'],
    'Well': [MapIcons.WELL, 'Well'],
    'Chasm': [MapIcons.CHASM, 'Chasm'],
    'Tear': [MapIcons.TOTK_TEAR, ''],
    'Lightroot': [MapIcons.TOTK_LIGHTROOT, ''],
  };

  constructor(mb: MapBase, l: any, showLabel: boolean, zIndexOffset?: number) {
    const lm = new map.LocationMarker(l);
    const [icon, label] = MapMarkerGenericLocationMarker.ICONS_AND_LABELS[lm.getIcon()];
    const msgId = lm.getMessageId();
    const msg = msgId ? MsgMgr.getInstance().getMsgWithFile('StaticMsg/LocationMarker', msgId) : label;
    super(mb, msg, lm.getXYZ(), {
      icon,
      zIndexOffset,
    });
    if (showLabel) {
      this.marker.bindTooltip(msg, {
        permanent: true,
        direction: 'center',
        className: `map-marker type-${lm.getIcon()}`,
      });
    }
    this.lm = lm;
  }
}

export class MapMarkerPlateauRespawnPos extends MapMarkerCanvasImpl {
  constructor(mb: MapBase, pos: Point) {
    super(mb, 'Plateau Respawn Location', pos, {
      fillColor: '#ff0000',
      fill: true,
      fillOpacity: 1,
      stroke: false,
      radius: 5,
    });
  }
}

export class MapMarkerLocation extends MapMarkerCanvasImpl {
  public readonly lp: map.LocationPointer;

  constructor(mb: MapBase, l: any) {
    const lp = new map.LocationPointer(l);
    const markerTypeStr = map.markerTypetoStr(lp.getType());
    const visibleMarkerTypeStr = l.PointerType ? 'Place' : markerTypeStr;
    let msg = MsgMgr.getInstance().getMsgWithFile('StaticMsg/LocationMarker', lp.getMessageId());
    if (msg === undefined) {
      msg = lp.getMessageId();
    }
    super(mb, msg, lp.getXYZ(), { stroke: false, fill: false });
    this.marker.unbindTooltip();
    this.marker.bindTooltip(msg + `<span class="location-marker-type">${visibleMarkerTypeStr}</span>`, {
      permanent: true,
      direction: 'center',
      className: `map-location show-level-${lp.getShowLevel()} type-${markerTypeStr}`,
    });
    this.lp = lp;
  }

  // Zoom level 2 -
  //   This needs serious attention **FIX**
  //   Location text has sections like Spot{Big, Middle, Small}*
  //     see: make_static_list.py
  // These include a TargetZoomLevel with the following (possibly multiple) values:
  //    "", Far, Near, Nearest, Farthest
  // Many times TargetZoomLevel = ""
  // Assume: section value Big, Middle, or Small controls which zoom level the
  //     text is shown at
  shouldBeShown() {
    // @ts-ignore
    if (this.lp.l && this.lp.l.ShowLevel !== undefined) {
      // @ts-ignore
      let label = this.lp.l;
      const pt = label.Translate;
      let level = [label.ShowLevel];
      if (label.ShowLevel.includes(",")) {
        level = label.ShowLevel.split(",");
      }

      if (label.MessageID == "Oasis") // No Kara Kara Bazaar
        return false;
      if (this.mb.activeLayer == "Sky" && pt.Y < 950)
        return false;
      if (this.mb.activeLayer == "Depths" && pt.Y > -50)
        return false;
      if (this.mb.activeLayer == "Surface" && (pt.Y < 0 || pt.Y > 950))
        return false;
      if (level.includes("Farthest") && this.mb.zoom <= 4)
        return true;
      if (level.includes("Far") && this.mb.zoom == 5)
        return true
      if (level.includes("") && this.mb.zoom >= 6)
        return true;
      if (level.includes("Near") && this.mb.zoom == 5)
        return true
      if (level.includes("Nearest") && this.mb.zoom >= 6)
        return true
      return false;
    }
    return false;
  }
}
export class MapMarkerDungeon extends MapMarkerGenericLocationMarker {
  public readonly dungeonNum: number;

  constructor(mb: MapBase, l: any) {
    super(mb, l, false, 1000);
    // Yes, extracting the dungeon number from the save flag is what Nintendo does.
    const dungeonNum = parseInt(this.lm.getSaveFlag().replace('Location_Dungeon', ''), 10);
    // Different marker for Shrine in Cave
    if (l.ShrineInCave) {
      this.marker.setIcon(MapIcons.TOTK_SHRINE_CAVE);
    } else {
      this.marker.setIcon(MapIcons.TOTK_SHRINE);
    }
    this.setTitle(MsgMgr.getInstance().getMsgWithFile('StaticMsg/Dungeon', this.lm.getMessageId()));
    this.marker.options.title = '';
    this.dungeonNum = dungeonNum;
    const sub = MsgMgr.getInstance().getMsgWithFile('StaticMsg/Dungeon', this.lm.getMessageId() + '_sub');
    const cave = (l.ShrineInCave) ? "<br>Cave" : "";
    this.marker.bindTooltip(`${this.title}<br>${sub}${cave}`, { pane: 'front2' });
  }
  shouldBeShown() {
    let layer = this.mb.activeLayer;
    const inSky = [
      38, 105, 43, 151, 34, 149, 82,
      128, 117, 148, 121, 145, 15, 55,
      60, 62, 63, 61, 71, 109, 150, 127,
      83, 93, 66, 146, 45, 50, 69,
      110, 99, 52];
    if (inSky.includes(this.dungeonNum)) {
      return layer == "Sky";
    }
    return layer == "Surface";
  }
}

export class MapMarkerLightroot extends MapMarkerGenericLocationMarker {
  public readonly checkpointNum: number;
  constructor(mb: MapBase, l: any) {
    super(mb, l, false, 1000)
    this.checkpointNum = parseInt(this.lm.getSaveFlag().replace('Location_CheckPoint', ''), 10);
    this.marker.setIcon(MapIcons.TOTK_LIGHTROOT);
    const msg = MsgMgr.getInstance().getMsgWithFile('StaticMsg/LocationMarker', l.MessageID);
    this.setTitle(msg);
    this.marker.options.title = '';
    this.marker.bindTooltip(msg, { pane: 'front2' });
  }
  shouldBeShown() {
    return this.mb.activeLayer == "Depths";
  }
}
export class MapMarkerDispenser extends MapMarkerGenericLocationMarker {
  public readonly info: any;
  constructor(mb: MapBase, info: any) {
    super(mb, info, false, 1000)
    this.marker.setIcon(MapIcons.DISPENSER);
    this.setTitle('Device Dispenser');
    this.marker.options.title = '';
    const items = info.equip.map((item: string) => `<div style="font-size: 0.9em">- ${getName(item)}</div>`).join("");
    this.marker.bindTooltip(`Device Dispenser<br/>${items}`, { pane: 'front2' });
    this.info = info;
    // @ts-ignore
    this.obj = info;
  }
  shouldBeShown() {
    return this.info.map_name.includes(this.mb.activeLayer)
  }
}

export class MapMarkerTear extends MapMarkerGenericLocationMarker {
  public readonly tearNum: number;
  constructor(mb: MapBase, l: any) {
    super(mb, l, false, 1001);
    this.tearNum = parseInt(this.lm.getSaveFlag().replace('Location_DragonTears', ''), 10);
    const titles = ["empty",  // 0
      "Where Am I?",         // 1
      "An Unfamiliar World", // 2
      "Mineru's Counsel",    // 3
      "The Gerudo Assault",  // 4
      "A Show of Fealty",    // 5
      "Zelda and Sonia",     // 6
      "Sonia is Caught by Treachery", //7
      "Birth of the Demon King", //8
      "The Sages' Vow",      // 9
      "A King's Duty",       // 10
      "A Master Sword in Time", // 11
      "Tears of the Dragon"  // 12
    ];
    this.setTitle(`${titles[this.tearNum]} (#${this.tearNum})`);
    this.marker.options.title = '';
    this.marker.bindTooltip(`${titles[this.tearNum]}<br>Tear of the Dragon #${this.tearNum}`, { pane: 'front2' });
  }
  shouldBeShown() {
    return this.mb.activeLayer == "Surface";
  }
}

export class MapMarkerDungeonDLC extends MapMarkerDungeon {
  constructor(mb: MapBase, l: any) {
    super(mb, l);
  }
}

export class MapMarkerPlace extends MapMarkerGenericLocationMarker {
  private isVillage: boolean;
  private info: any;
  constructor(mb: MapBase, l: any) {
    const isVillage = l['Icon'] == 'Village';
    super(mb, l, isVillage);
    this.isVillage = isVillage;
    this.info = l;
  }

  shouldBeShown() {
    const layer = this.mb.activeLayer;
    const y = this.info.Translate.Y;
    if (layer == 'Sky')
      return false;
    if (layer == 'Depths' && y < 0)
      return true;
    if (layer == 'Surface' && y >= 0)
      return true;
    return false;
  }
}

export class MapMarkerTower extends MapMarkerGenericLocationMarker {
  constructor(mb: MapBase, l: any) {
    super(mb, l, false, 1001);
    this.marker.options.title = '';
    this.marker.bindTooltip(this.title, { pane: 'front2' });
  }
  shouldBeShown() {
    return this.mb.activeLayer == "Surface";
  }
}
export class MapMarkerCave extends MapMarkerGenericLocationMarker {
  private info: any;
  constructor(mb: MapBase, l: any) {
    super(mb, l, false, 1001);
    this.marker.options.title = '';
    this.marker.bindTooltip(this.title, { pane: 'front2' });
    this.info = l;
  }

  shouldBeShown() {
    let y = this.info.Translate.Y;
    if (this.mb.activeLayer == 'Sky' && y > 1000) {
      return true;
    }
    if (this.mb.activeLayer == 'Surface' && y < 1000 && y > -50) {
      return true;
    }
    if (this.mb.activeLayer == 'Depths' && this.info.Icon == 'Chasm') {
      return true;
    }
    return false;
  }
}

export class MapMarkerLabo extends MapMarkerGenericLocationMarker {
  constructor(mb: MapBase, l: any) {
    super(mb, l, false);
  }

  shouldBeShown() {
    return this.mb.activeLayer == "Surface";
  }
}

export class MapMarkerShop extends MapMarkerGenericLocationMarker {
  private info: any;
  constructor(mb: MapBase, l: any) {
    super(mb, l, false);
    this.marker.options.title = '';
    this.marker.bindTooltip(this.title, { pane: 'front2' });
    this.info = l;
  }

  // This needs attention **FIX**
  shouldBeShown() {
    const layer = this.mb.activeLayer;
    const y = this.info.Translate.Y;
    if (layer == 'Sky' && y > 1000)
      return true;
    if (layer == 'Depths' && y < 0)
      return true;
    if (layer == 'Surface' && y >= 0) {
      if (this.info.MessageID == 'BatteryExchangeShop_01') {
        return true;
      }
      return this.mb.zoom >= 6;
    }

    return false;
  }
}

const KOROK_ICON = (() => {
  const img = new Image();
  img.src = '/icons/mapicon_korok.png';
  return img;
})();

export class MapMarkerKorok extends MapMarkerCanvasImpl {
  public readonly info: any;
  public readonly obj: ObjectMinData;

  constructor(mb: MapBase, info: any, extra: any) {
    let id = info.id || 'Korok';
    super(mb, `${id}`, [info.Translate.X, info.Translate.Y, info.Translate.Z], {
      icon: KOROK_ICON,
      iconWidth: 20,
      iconHeight: 20,
      showLabel: extra.showLabel,
      className: classToColor(id),
    });
    this.info = info;
    this.obj = info;
  }
  shouldBeShown() {
    return this.info.map_name == this.mb.activeLayer;
  }
}

// Convert first letter of Korok ID to CSS classname
function classToColor(id: string): string {
  let classes: any = {
    'UM': 'ulri',
    'LL': 'lookout',
    'EC': 'eldin',
    'SS': 'sahasra',
    'RW': 'rabella',
    'GH': 'gerudohigh',
    'RP': 'rospro',
    'TR': 'thyphlo',
    'PF': 'popla',
    'ML': 'lanayru',
    'HF': 'hyrulefield',
    'LB': 'lindor',
    'PS': 'pikida',
    'P': 'plateau',
    'T': 'tabantha',
    'X': 'castle',
    'GC': 'gerudo',
    'UZ': 'zorana',
    'SK': 'sky',
    'GS': 'greatskyisland',
  };
  const ID = id.slice(0, 2);
  if (ID in classes) {
    return classes[ID] + ' korok';
  }
  return 'default';
}

function getName(name: string) {
  if (Settings.getInstance().useActorNames)
    return name;
  return MsgMgr.getInstance().getName(name) || name;
}

function setObjMarkerTooltip(title: string, layer: L.Layer, obj: ObjectMinData) {
  const tooltipInfo = [title];
  if (obj.name === 'LocationMarker' && obj.Location) {
    const locationName = MsgMgr.getInstance().getMsgWithFile('StaticMsg/LocationMarker', obj.Location)
      || MsgMgr.getInstance().getMsgWithFile('StaticMsg/Dungeon', obj.Location);
    tooltipInfo.push(`${locationName}`);
  }
  if (obj.drop) {
    if (obj.drop.type === "Actor")
      tooltipInfo.push(getName(obj.drop.value));
    else if (obj.drop.type === "Table" && !isDefaultDropTable(obj.drop))
      tooltipInfo.push('Drop table: ' + obj.drop.value);
  }
  if (obj.equip) {
    for (const e of obj.equip)
      tooltipInfo.push(getName(e));
  }
  layer.setTooltipContent(tooltipInfo.join('<br>'));
}

function hashString(s: string) {
  // https://stackoverflow.com/a/7616484/1636285
  var hash = 0, i, chr;
  if (s.length === 0) return hash;
  for (i = 0; i < s.length; i++) {
    chr = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash >>> 0;
}

export const enum SearchResultUpdateMode {
  UpdateStyle = 1 << 0,
  UpdateVisibility = 1 << 1,
  UpdateTitle = 1 << 2,
}

export class MapMarkerObj extends MapMarkerCanvasImpl {
  constructor(mb: MapBase, public readonly obj: ObjectMinData, fillColor: string, strokeColor: string) {
    super(mb, '', obj.pos, {
      radius: 7,
      weight: 2,
      fillOpacity: 0.7,
      fillColor,
      color: strokeColor,

      // @ts-ignore
      contextmenuItems: [
        {
          text: 'Show no-revival area',
          callback: ({ latlng }: ui.LeafletContextMenuCbArg) => {
            const [x, y, z] = mb.toXYZ(latlng);
            const col = math.clamp(((x + 5000) / 1000) | 0, 0, 9);
            const row = math.clamp(((z + 4000) / 1000) | 0, 0, 7);

            let minx = (col - 1) * 1000 - 4500;
            let maxx = (col + 1) * 1000 - 4500;
            minx = math.clamp(minx, -5000, 5000);
            maxx = math.clamp(maxx, -5000, 5000);

            let minz = (row - 1) * 1000 - 3500;
            let maxz = (row + 1) * 1000 - 3500;
            minz = math.clamp(minz, -4000, 4000);
            maxz = math.clamp(maxz, -4000, 4000);

            const pt1 = mb.fromXYZ([minx, 0, minz]);
            const pt2 = mb.fromXYZ([maxx, 0, maxz]);
            const rect = L.rectangle(L.latLngBounds(pt1, pt2), {
              color: "#ff7800",
              weight: 2,
              // @ts-ignore
              contextmenu: true,
              contextmenuItems: [{
                text: 'Hide no-revival area',
                callback: () => { rect.remove(); },
              }],
            });
            rect.addTo(mb.m);
          },
          index: 0,
        },
        {
          text: 'Show generation group',
          callback: ({ latlng }: ui.LeafletContextMenuCbArg) => {
            mb.m.fire('AppMap:show-gen-group', {
              mapType: this.obj.map_type,
              mapName: this.obj.map_name,
              hashId: this.obj.hash_id,
            });
          },
          index: 0,
        },
        {
          text: 'Mark as Completed',
          callback: () => {
            console.log('Mark', this.obj.hash_id);
            mb.m.fire('AppMap:update-search-markers', {
              hash_id: this.obj.hash_id,
            });
          },
          index: 0,
        },
      ],
    });
    this.marker.bringToFront();
    this.updateTitle();
  }

  updateTitle() {
    const actor = (Settings.getInstance().hardMode && !this.obj.disable_rankup_for_hard_mode)
      ? rankUpEnemyForHardMode(this.obj.name)
      : this.obj.name;
    this.title = getName(actor);
    setObjMarkerTooltip(this.title, this.marker, this.obj);
  }

  update(groupFillColor: string, groupStrokeColor: string, mode: SearchResultUpdateMode) {
    if (mode & SearchResultUpdateMode.UpdateTitle)
      this.updateTitle();

    if (mode & SearchResultUpdateMode.UpdateStyle) {
      let fillColor = groupFillColor;
      let color = groupStrokeColor;
      if (Settings.getInstance().colorPerActor) {
        fillColor = ui.genColor(1000, hashString(this.title) % 1000);
        color = ui.shadeColor(fillColor, -15);
      }

      this.marker.setStyle({
        fillColor,
        color,
      });
    }

    const radius = Math.min(Math.max(this.mb.zoom, 4), 7);
    this.marker.setRadius(radius);
    this.marker.setStyle({
      weight: radius >= 5 ? 2 : 0,
    });
  }
}

export class MapMarkerSearchResult extends MapMarkerObj {
  private marked: boolean;
  constructor(mb: MapBase, obj: ObjectMinData) {
    super(mb, obj, '#e02500', '#ff2a00');
    this.marked = false;
    // @ts-ignore
    /*
    this.marker.badge({
      name: 'checkmark',
      type: 'checkmark',
      radius: 6,
      fillColor: '#645838',
      fillOpacity: 1,
      checkmark: {
        weight: 2,
        color: "#B08844",
        lineCap: 'square',
      },
    });
    // @ts-ignore
    this.marker.badge({
      type: 'alert',
      name: 'alert',
      position: 'upper-left',
      fillColor: 'orange',
      fillOpacity: 1,
      color: 'white',
    })
    // @ts-ignore
    this.marker.badge({
      type: 'alert',
      name: 'alert3',
      position: 'lower-left',
      fillColor: 'red',
      fillOpacity: 1,
      color: 'white',
    })
    // @ts-ignore
    this.marker.badge({
      type: 'alert',
      name: 'alert2',
      position: 'lower-right',
      fillColor: 'yellow',
      fillOpacity: 1,
      color: 'white',
    })
    */
  }
  setMarked(marked: boolean) {
    this.marked = marked;
    this.marker.setStyle({});
  }
}

L.CircleMarker.include({
  badge: function(options: any = {}) {
    const defaults = {
      position: 'upper-right',
      radius: 6,
      offset: 10,
      stroke: true,
      color: 'white',
      weight: 0,
      opacity: 1.0,
      fill: true,
      fillColor: 'white',
      fillOpacity: 0.5,
      name: "default",
      type: "checkmark",
      checkmark: {
        color: 'black',
        weight: 2,
        opacity: 1,
        stroke: true,
        dx: 1,
        dy: 1,
      }
    }

    const badge_options = Object.assign({}, defaults, options);

    badge_options.checkmark = Object.assign({}, defaults.checkmark, options.checkmark);
    if (!this._badges) {
      this._badges = {};
    }
    this._badges[badge_options.name] = badge_options;
    return this;
  },
  getPosition(badge: any) {
    const p = this._point;
    const r = this.getRadius();
    let dx = r;
    let dy = r;
    if (badge.position == 'upper-right') {
      dx = r;
      dy = -r;
    } else if (badge.position == 'upper-left') {
      dx = -r;
      dy = -r;
    } else if (badge.position == 'lower-right') {
      dx = r;
      dy = r;
    } else if (badge.position == 'lower-left') {
      dx = -r;
      dy = r;
    }
    const x = p.x + dx;
    const y = p.y + dy;
    return { x, y }
  },
  drawAlert(badge: any) {
    const ctx = this.getCtx();
    let p = this.getPosition(badge);
    // Circle
    ctx.beginPath();
    ctx.arc(p.x, p.y, badge.radius, 0, Math.PI * 2, true);
    this._renderer._fillStroke(ctx, { options: badge });
    // Point
    ctx.font = `bold ${badge.radius * 1.8}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = badge.color;
    ctx.fillText("!", p.x, p.y + badge.radius * 0.7);
  },
  drawCheckmark(badge: any) {
    const ctx = this.getCtx();
    let p = this.getPosition(badge);
    // Circle
    ctx.beginPath();
    ctx.arc(p.x, p.y, badge.radius, 0, Math.PI * 2, true);
    this._renderer._fillStroke(ctx, { options: badge });
    // Checkmark
    const s = badge.radius / 3;
    p.x += badge.checkmark.dx;
    p.y += badge.checkmark.dy;
    ctx.beginPath();
    ctx.moveTo(p.x + s, p.y - s);
    ctx.lineTo(p.x - s, p.y + s);
    ctx.lineTo(p.x - s - s, p.y);
    this._renderer._fillStroke(ctx, { options: badge.checkmark });
  },
  getCtx: function() {
    return this._renderer._ctx;
  },
  drawBadges: function() {
    if (!this._badges) {
      return;
    }
    Object.values(this._badges).forEach((badge: any) => {

      if (badge.type == 'checkmark') {
        this.drawCheckmark(badge);
      } else if (badge.type == 'alert') {
        this.drawAlert(badge);
      } else if (badge.draw) {
        badge.draw(this, badge);
      }
    });
  },
  _updatePath: function() {
    //console.log("update circle");
    this._renderer._updateCircle(this);
    this.drawBadges();
  },
  fillStroke(ctx: any, layer: any) {
    this._renderer._fillStroke(ctx, layer);
  },
})
function addCheckMark(layer: any, badge: any) {
  const renderer = layer._renderer;
  if (layer._empty() || !renderer._drawing) {
    return;
  }
  const p = layer._point, radius = layer._radius;
  const ctx = renderer._ctx;
  if (!ctx) {
    return;
  }
  if (badge) {
    if (badge.draw) {
      return badge.draw(ctx, layer, badge);
    }
    ctx.beginPath();
    ctx.arc(p.x + radius, p.y - radius, 6, 0, Math.PI * 2, true);
    renderer._fillStroke(ctx, { options: badge })
    return;
  }


  // Enclosing Circle
  ctx.beginPath();
  ctx.arc(p.x + radius, p.y - radius, 6, 0, Math.PI * 2, true);
  ctx.fillStyle = "#645838";
  ctx.fill();

  // Checkmark
  ctx.beginPath();
  const s = 2;
  ctx.moveTo(p.x + 1 + radius + s, p.y - radius - s + 1);
  ctx.lineTo(p.x + 1 + radius - s, p.y - radius + s + 1);
  ctx.lineTo(p.x + 1 + radius - s - s, p.y - radius + s - s + 1);
  ctx.strokeStyle = "#B08844";
  ctx.lineWidth = 2;
  ctx.lineCap = 'square';
  ctx.stroke();

}
