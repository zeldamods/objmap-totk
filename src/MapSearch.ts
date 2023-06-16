import * as L from 'leaflet';

import { MapBase } from '@/MapBase';
import * as MapMarkers from '@/MapMarker';
import { SearchResultUpdateMode } from '@/MapMarker';
import {
  MapMgr,
  ObjectMinData,
} from '@/services/MapMgr';
import { Settings } from '@/util/settings';
import * as ui from '@/util/ui';

export interface SearchPreset {
  label: string;
  query: string;
}

export interface SearchPresetGroup {
  label: string;
  presets: SearchPreset[];
}

const LAUNCHABLE_OBJS = `TwnObj_City_GoronPot_A_M_Act_01
FldObj_BoardIron_A_01
FldObj_FallingRock_*
FldObj_KorokStoneLift_A_01
FldObj_PushRock*
Kibako*
Obj_BoardIron_*
Obj_BoxIron_*
Obj_BreakBoxIron*
Obj_LiftRock*
Obj_RockCover
Barrel`;

function makeActorQuery(actors: string[]): string {
  return actors.map(x => `actor:^${x}`).join(' OR ');
}

function makeNameQuery(names: string[]): string {
  return names.map(x => `name:^"${x}"`).join(' OR ');
}

export const SEARCH_PRESETS: ReadonlyArray<SearchPresetGroup> = Object.freeze([
  {
    label: '<i class="far fa-gem"></i>',
    presets: [
      { label: 'Treasure Chests', query: 'actor:^"TBox_"' },
      { label: 'Arrows', query: 'Arrow NOT Enemy' },
      { label: 'Zonaite Deposits', query: 'Zonaite Deposit' },
      { label: 'Ore Deposits', query: 'name:"Ore Deposit"' },
      { label: 'Weapons (excluding enemies)', query: 'Weapon_ NOT actor:^"Enemy_"' },
    ],
  },
  {
    label: '<i class="fas fa-apple-alt"></i>',
    presets: [
      { label: 'Cooking Pots', query: 'actor:Item_CookSet*' },
      { label: 'Fruits', query: 'Fruit' },
      { label: 'Enduring Ingredients', query: makeNameQuery(['Endura', 'Tireless Frog']) },
      { label: 'Fireproof Ingredients', query: makeNameQuery(['Fireproof', 'Smotherwing Butterfly']) },
      { label: 'Hasty Ingredients', query: makeNameQuery(['Hightail Lizard', 'Hot-Footed Frog', 'Fleet-Lotus Seeds', 'Rushroom', 'Swift Carrot', 'Swift Violet']) },
      //{label: 'Hasty Ingredients (Lvl2 only)', query: makeNameQuery(['Hot-Footed Frog', 'Fleet-Lotus Seeds', 'Swift Violet'])},
      { label: 'Hearty Ingredients', query: 'name:Hearty' },
      { label: 'Mighty Ingredients', query: makeNameQuery(['Mighty Item', 'Razorshroom', 'Razorclaw Crab', 'Bladed Rhino Beetle']), },
      { label: 'Tough Ingredients', query: makeNameQuery(['Ironshroom', 'Fortified Pumpkin', 'Rugged Rhino Beetle', 'Ironshell Crab', 'Armored', 'Armoranth']) },
    ],
  },
  // {
  //   label: '<i class="fa fa-vial"></i>',
  //   presets: [
  //     {label: 'Blue Dye Materials', query: makeNameQuery(['Blue nightshade', 'Ice Keese', 'Chillshroom'])+' OR drop: "sapphire"'},
  //     {label: 'Red Dye Materials', query: makeNameQuery(['Apple', 'Spicy Pepper', 'Hylian Shroom', 'Sunshroom','Fire Keese','Fire Chuchu'])},
  //     {label: 'Yellow Dye Materials', query: makeNameQuery(['Mighty Bananas', 'Zapshroom','Bird Egg','Thunderwing Butterfly','Electric Darner','Energetic Rhino Beetle','Electric Lizalfos','Electric Keese','Electric Chuchu','Hinox'])+' OR drop:"Topaz"'},
  //     {label: 'White Dye Materials', query: makeNameQuery(['Hylian Rice','Silent Princess','Fresh Milk','Ice Chuchu','Lynel'])+' OR drop:"Star Fragment" OR drop:"Diamond"'},
  //     {label: 'Black Dye Materials', query: makeNameQuery(['Hearty Truffle','Big Hearty Truffle','Lynel'])+' OR drop:"Flint"'},
  //     {label: 'Purple Dye Materials', query: makeNameQuery(['Rushroom','Swift Violet','Armoranth','Sunset Firefly','Bokoblin Guts'])},
  //     {label: 'Green Dye Materials', query: makeNameQuery(['Hydromelon','Fleet-Lotus Seeds','Stamella Shroom','Hyrule Herb','Cane Sugar','Restless Cricket','Rugged Rhino Beetle','Hot-Footed Frog', 'Molduga'])+' OR '+makeActorQuery(['Enemy_Lizalfos_Middle','Enemy_Lizalfos_Senior','Enemy_Lizalfos_Junior',])},
  //     {label: 'Light Blue Dye Materials', query: makeNameQuery(['Silent Shroom','Cool Safflina','Blue Moblin','Black Moblin'])+makeActorQuery(['Enemy_Chuchu_Junior','Enemy_Chuchu_Middle','Enemy_Chuchu_Senior'])},
  //     {label: 'Navy Dye Materials', query: 'name:"Bladed Rhino Beetle" OR drop:"Luminous Stone"'},
  //     {label: 'Orange Dye Materials', query: makeNameQuery(['Voltfruit', 'Endura Shroom', 'Swift Carrot', 'Fortified Pumpkin', 'Warm Safflina', 'Mighty Thistle', 'Courser Bee Honey'])+' OR drop:"Amber"'},
  //     {label: 'Peach Dye Materials', query: makeNameQuery(['Wildberry', 'Big Hearty Radish', 'Hearty Radish', 'Rock Salt'])},
  //     {label: 'Crimson Dye Materials', query: makeNameQuery(['Razorshroom', 'Chickaloo Tree Nut', 'Tireless Frog'])},
  //     {label: 'Light Yellow Dye Materials', query: makeNameQuery(['Hearty Durian', 'Palm Fruit', 'Endura Carrot', 'Electric Safflina', 'Tabantha Wheat', 'Goat Butter', 'Bokoblin'])+' OR drop:"Opal"'},
  //     {label: 'Brown Dye Materials', query: makeNameQuery(['Ironshroom', 'Acorn', 'Hightail Lizard', 'Hinox', 'Stalnox', 'Molduga'])},
  //     {label: 'Gray Dye Materials', query: makeNameQuery(['Smotherwing Butterfly', 'Fireproof Lizard', 'Moblin', 'Lizalfos'])+' OR actor:"enemy_bokoblin_*"'},
  //   ]
  // },
  {
    label: '<i class="fas fa-skull"></i>',
    presets: [
      { label: "Hinox/Stalnox", query: "Enemy_Giant" },
      { label: "Talus", query: "Enemy_Golem NOT Little" },
      { label: "Moldugas", query: "Molduga" },
      { label: "Flux Constructs", query: "Flux Construct" },
      { label: "Frox", query: "Frox NOT Baby" },
      { label: "Gleeoks", query: "Enemy_Drake" },
      { label: "Monster Forces", query: "Enemy_Army_Manager" },
      { label: "Monster Control Crew", query: "Hoz OR Flaxel OR Toren" },
      { label: 'Enemies', query: 'actor:^"Enemy_"' },
    ]
  },
  {
    label: '<i class="fa fa-ellipsis-h"></i>',
    presets: [
      { label: 'Wild Horses', query: "WildHorse*" },
      { label: 'Special Horses', query: "GameRomHorseZelda OR GameRomHorseGold OR GameRomHorse00L OR GameRomHorse01L" },
      { label: 'Shadowy Figures with Weapons', query: 'Npc_MinusFieldGhost_000' },
      { label: 'Bubbulfrogs', query: 'Bubbulfrog' },
      { label: 'Bargainer Statue', query: 'Bargainer Statue' },
      { label: 'Addison', query: 'Addison NOT Complete' },
      { label: 'Schema Stones', query: 'Josha OR (Servant_Minus00* NOT Forge NOT Minus0005 NOT Minus0004 NOT Minus0001)' },
      { label: 'Yiga Schematics', query: 'Obj_AutoBuilderDraftAssassin' },
      { label: "Sage's Will", query: `"Sage's Will"` },
      { label: 'Old Maps', query: 'Old Map' },
      { label: 'Statues Paths', query: 'WisemanStatue' },
      { label: 'Messages from an Ancient Era Stone Tablets', query: "Ancient Stone Tablet map: Sky" },

    ],
  }
]);

export class SearchExcludeSet {
  constructor(public query: string, public label: string, public hidden = false) {
  }

  size() {
    return this.ids.size;
  }

  ids: Set<number> = new Set();

  async init() {
    this.ids = new Set(await MapMgr.getInstance().getObjids(Settings.getInstance().mapType, Settings.getInstance().mapName, this.query));
  }
}

export class SearchResultGroup {
  constructor(public query: string, public label: string, public enabled = true) {
  }

  size() {
    return this.markers.data ? this.markers.data.length : 0;
  }

  getMarkers() {
    return this.markers.data;
  }

  remove() {
    this.markerGroup.data.remove();
    this.markerGroup.data.clearLayers();
    this.shownMarkers = new ui.Unobservable([]);
  }

  update(mode: SearchResultUpdateMode, excludedSets: SearchExcludeSet[]) {
    const isExcluded = (marker: MapMarkers.MapMarkerObj) => {
      return excludedSets.some(set => set.ids.has(marker.obj.objid));
    };
    for (const [i, marker] of this.markers.data.entries()) {
      const shouldShow = mode & SearchResultUpdateMode.UpdateVisibility
        ? (this.enabled && !isExcluded(marker)) : this.shownMarkers.data[i];
      if (shouldShow != this.shownMarkers.data[i]) {
        if (shouldShow)
          this.markerGroup.data.addLayer(marker.getMarker());
        else
          this.markerGroup.data.removeLayer(marker.getMarker());
        this.shownMarkers.data[i] = shouldShow;
      }
      if (shouldShow)
        marker.update(this.fillColor, this.strokeColor, mode);
    }
  }

  setObjects(map: MapBase, objs: ObjectMinData[]) {
    this.markers = new ui.Unobservable(
      objs.map(r => new MapMarkers.MapMarkerObj(map, r, this.fillColor, this.strokeColor)));
    this.markerGroup.data.clearLayers();
    this.shownMarkers = new ui.Unobservable([]);
  }

  async init(map: MapBase) {
    this.fillColor = ui.shadeColor(ui.genColor(10, SearchResultGroup.COLOR_COUNTER++), -5);
    this.strokeColor = ui.shadeColor(this.fillColor, -20);
    this.markerGroup.data.addTo(map.m);
    if (!this.query)
      return;
    const results = await MapMgr.getInstance().getObjs(Settings.getInstance().mapType, Settings.getInstance().mapName, this.query);
    this.setObjects(map, results);
  }

  private static COLOR_COUNTER = 0;
  private markerGroup = new ui.Unobservable<L.LayerGroup>(L.layerGroup());
  private markers = new ui.Unobservable<MapMarkers.MapMarkerObj[]>([]);
  private shownMarkers: ui.Unobservable<boolean[]> = new ui.Unobservable([]);
  private fillColor = '';
  private strokeColor = '';
}
