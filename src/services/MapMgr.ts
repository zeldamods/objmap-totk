import { GAME_FILES } from '@/util/map';

const RADAR_URL = process.env.VUE_APP_RADAR_URL;

export type Vec3 = [number, number, number];

export interface ResPlacementObj {
  readonly Dynamic?: { [key: string]: any };
  readonly Phive?: { [key: string]: any };
  readonly Presence?: {
    FlagName: string;
    IsCheckLazy: boolean;
    IsNegation: boolean;
  };
  readonly SRTHash: number;
  readonly Hash: string;
  readonly Gyaml: string;
  readonly Links?: any;
  readonly Translate: Vec3;
  readonly Scale?: Vec3 | number;
  readonly Rotate?: Vec3 | number;
  readonly Rails?: any;
}

export interface ObjectMinData {
  objid: number;
  hash_id: string;
  map_type: string;
  map_name?: string;
  map_static: boolean;
  name: string;
  drop?: {
    type: "Table" | "Actor";
    value: any;
  };
  equip?: string[];
  pos: [number, number, number];

  // False if not present.
  hard_mode?: boolean;
  one_hit_mode?: boolean;
  disable_rankup_for_hard_mode?: boolean;

  // Only for LocationMarker.
  Location?: string;

  // Only for weapons and enemies.
  scale?: number;

  korok_type?: string;
  korok_id?: string;
}

export interface ObjectData extends ObjectMinData {
  map_name: string;
  data: ResPlacementObj;
}

export interface AiGroup {
  hash_id: string;
  data: { [key: string]: any };
  referenced_entities: { [hash_id: string]: ObjectData | undefined };
}

function parse(r: Response) {
  if (r.status == 404)
    return null;
  return r.json().then(d => Object.freeze(d));
}

export class MapMgr {
  private static instance: MapMgr;
  static getInstance() {
    if (!this.instance)
      this.instance = new this();
    return this.instance;
  }

  private infoMainField: any;

  async init() {
    await Promise.all([
      fetch(`${GAME_FILES}/map_summary/MainField/static.json`).then(r => r.json())
        .then((d) => {
          this.infoMainField = Object.freeze(d);
        }),
    ]);
  }

  fetchAreaMap(name: string): Promise<{ [data: number]: Array<GeoJSON.Polygon | GeoJSON.MultiPolygon> }> | GeoJSON.FeatureCollection {
    return fetch(`${GAME_FILES}/ecosystem/${name}.json`).then(parse);
  }

  getInfoMainField() {
    return this.infoMainField;
  }

  getObjByObjId(objid: number): Promise<ObjectData | null> {
    return fetch(`${RADAR_URL}/obj/${objid}`).then(parse);
  }
  getObj(mapType: string, mapName: string, hashId: string): Promise<ObjectData | null> {
    return fetch(`${RADAR_URL}/obj/${mapType}/${mapName}/${hashId}`).then(parse);
  }
  getObjByHashId(hashId: string): Promise<ObjectData | null> {
    return fetch(`${RADAR_URL}/obj_by_hash/${hashId}`).then(parse);
  }

  getObjGenGroup(mapType: string, mapName: string, hashId: string): Promise<ObjectData[]> {
    return fetch(`${RADAR_URL}/obj/${mapType}/${mapName}/${hashId}/gen_group`).then(parse);
  }

  async getObjAiGroups(mapType: string, mapName: string, hashId: string): Promise<AiGroup[]> {
    const res = await fetch(`${RADAR_URL}/obj/${mapType}/${mapName}/${hashId}/ai_groups`);
    return parse(res);
  }

  getObjShopData() {
    return fetch(`${GAME_FILES}/ecosystem/beedle_shop_data.json`).then(parse);
  }

  getObjDropTables(unitConfigName: string, tableName: string) {
    return fetch(`${RADAR_URL}/drop/${unitConfigName}/${tableName}`).then(parse);
  }

  getObjRails(hashId: string): Promise<any> {
    return fetch(`${RADAR_URL}/rail/${hashId}`).then(parse);
  }

  getObjs(mapType: string, mapName: string, query: string, withMapNames = false, limit = -1): Promise<ObjectMinData[]> {
    let url = new URL(`${RADAR_URL}/objs/${mapType}/${mapName}`);
    url.search = new URLSearchParams({
      q: query,
      withMapNames: withMapNames.toString(),
      limit: limit.toString(),
    }).toString();
    return fetch(url.toString()).then(parse);
  }

  getObjids(mapType: string, mapName: string, query: string): Promise<number[]> {
    let url = new URL(`${RADAR_URL}/objids/${mapType}/${mapName}`);
    url.search = new URLSearchParams({
      q: query,
    }).toString();
    return fetch(url.toString()).then(parse);
  }
}

export function parseHash(hash: string) {
  return '0x' + BigInt(hash).toString(16).padStart(16, '0');
}
