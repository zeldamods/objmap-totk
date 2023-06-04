import 'leaflet/dist/leaflet.css';
import 'leaflet-rastercoords';
import 'leaflet-contextmenu';
import 'leaflet-contextmenu/dist/leaflet.contextmenu.css';
import 'leaflet.control.opacity/dist/L.Control.Opacity.css';
import 'leaflet-mouse-position';
import '@/util/leaflet_tile_workaround.js';
import 'leaflet.control.opacity';

import * as L from 'leaflet';

import { CanvasMarker } from '@/util/CanvasMarker';
import * as map from '@/util/map';
import { Point } from '@/util/map';
import * as ui from '@/util/ui';

declare module 'leaflet' {
  export type RasterCoords = any;
  export let RasterCoords: any;
}

const TOTK_MAP = map.GAME_FILES + "/map/";
const AREAS = ["Sky", "Surface", "Depths"];

export const SHOW_ALL_OBJS_FOR_MAP_UNIT_EVENT = 'objmap::SHOW_ALL_OBJS_FOR_MAP_UNIT';
export const MARKER_SELECTED_EVENT = 'objmap::markerSelected';

export class MapBase {
  m!: L.Map;
  private rc!: L.RasterCoords;
  center: Point = [0, 0, 0];
  zoom: number = map.DEFAULT_ZOOM;
  private zoomChangeCbs: Array<(zoom: number) => void> = [];
  baseLayer: L.Layer[] = [];
  baseMapLayers: any = {};
  refGrid: Array<L.LayerGroup> = [];
  refGridOn: boolean = false;
  activeLayer!: string;

  async loadTowerAreas() {
    /*
    const areas = await MapMgr.getInstance().fetchAreaMap('MapTower');
    for (const [data, features] of Object.entries(areas)) {
      const layers: L.GeoJSON[] = features.map((feature) => {
        return L.geoJSON(feature, {
          style: function(_) {
            return { weight: 0.5, fill: false, color: '#60B0E0' }
          },
        });
      });
      layers.forEach(layer => this.refGrid[3].addLayer(layer));
    }
    this.showReferenceGridInternal();
    */
  }

  async showReferenceGridInternal() {
    if (!this.refGrid.length) {
      this.refGrid = this.createMarkers();
    }
    const zoomLevel = this.m.getZoom();
    let minZoom = [1, 4, 5, 1];
    if (this.refGridOn) {
      this.refGrid.forEach((layer, i) => {
        //for (let i = 0; i < 4; i++) {
        let visible = this.m.hasLayer(layer);
        if (zoomLevel >= minZoom[i]) {
          if (!visible) {
            this.m.addLayer(layer);
          }
        } else {
          if (visible) {
            this.m.removeLayer(layer);
          }
        }
      });
    } else {
      this.refGrid.forEach(layer => this.m.removeLayer(layer));
    }
  }

  showReferenceGrid(show: boolean) {
    this.refGridOn = show;
    this.showReferenceGridInternal();
  }


  toXYZ(latlng: L.LatLng): Point {
    return [latlng.lng, 0, latlng.lat];
  }
  fromXYZ(pos: Point): L.LatLngExpression {
    return [pos[2], pos[0]];
  }

  setView(pos: Point, zoom = -1) {
    this.center = pos;
    this.setZoomProp(zoom == -1 ? this.m.getZoom() : zoom);
    this.m.setView(this.fromXYZ(this.center), this.zoom);
  }

  emitMarkerSelectedEvent(marker: any) { this.m.fireEvent(MARKER_SELECTED_EVENT, { marker }); }
  registerMarkerSelectedCb(cb: (marker: any) => void) { this.m.on(MARKER_SELECTED_EVENT, (e: any) => cb(e.marker)); }

  registerZoomChangeCb(cb: (zoom: number) => void) { this.zoomChangeCbs.push(cb); }
  registerMoveEndCb(cb: any) { this.m.on('moveend', cb); }
  registerZoomCb(cb: any) { this.m.on('zoom', cb); }
  // Fires shortly after zoomstart with the target zoom level.
  registerZoomAnimCb(cb: any) { this.m.on('zoomanim', cb); }
  registerZoomEndCb(cb: any) { this.m.on('zoomend', cb); }
  registerBaseLayerChangeCb(cb: any) {
    this.m.on('objmap:base-layer-change', () => {
      cb()
    })
  }

  constructor(element: string) {
    this.constructMap(element);
    this.initBaseMap();
  }

  private constructMap(element: string) {
    const crs = L.Util.extend({}, L.CRS.Simple);
    // @ts-ignore
    crs.transformation = new L.Transformation(4 / map.TILE_SIZE, map.MAP_SIZE[0] / map.TILE_SIZE,
      4 / map.TILE_SIZE, map.MAP_SIZE[1] / map.TILE_SIZE);

    L.Canvas.include({
      _botwDrawCanvasImageMarker(layer: CanvasMarker) {
        // @ts-ignore
        if (layer._empty())
          return;
        // @ts-ignore
        const p: L.Point = layer._point;
        const ctx: CanvasRenderingContext2D = this._ctx;
        const img: HTMLImageElement = (layer.options.icon)!;
        if (layer.options.iconWidth && layer.options.iconHeight) {
          ctx.drawImage(img, p.x - layer.options.iconWidth / 2, p.y - layer.options.iconHeight / 2,
            layer.options.iconWidth, layer.options.iconHeight);
        } else {
          ctx.drawImage(img, p.x - img.width / 2, p.y - img.height / 2);
        }
      },
    });

    let padding = 0.7;
    if (L.Browser.safari && L.Browser.mobile && L.Browser.retina) {
      padding = 0.1;
    }
    const renderer = L.canvas({
      // Set a larger padding to avoid markers fading in too late when dragging
      padding,
    });

    this.m = new L.Map(element, {
      attributionControl: false,
      zoomControl: false,
      zoom: map.DEFAULT_ZOOM,
      minZoom: map.MIN_ZOOM,
      maxZoom: map.MAX_ZOOM,
      maxBoundsViscosity: 1.0,
      crs,

      renderer,
      preferCanvas: true,

      // @ts-ignore
      contextmenu: true,
      contextmenuItems: [
        {
          text: 'Copy coordinates',
          callback: ({ latlng }: ui.LeafletContextMenuCbArg) => {
            const [x, y, z] = this.toXYZ(latlng);
            ui.copyToClipboard(`${x},${-z}`);
          },
        },
        {
          text: 'Center map here',
          callback: ({ latlng }: ui.LeafletContextMenuCbArg) => {
            this.m.panTo(latlng);
          }
        },
        {
          text: 'Show all objects in map unit',
          callback: ({ latlng }: ui.LeafletContextMenuCbArg) => {
            this.m.fire(SHOW_ALL_OBJS_FOR_MAP_UNIT_EVENT, { latlng });
          },
        }
      ],
    });

    this.rc = new L.RasterCoords(this.m, map.MAP_SIZE);
    this.rc.setMaxBounds();

    this.registerZoomAnimCb((evt: L.ZoomAnimEvent) => {
      this.setZoomProp(evt.zoom);
    });
    this.registerMoveEndCb(() => {
      this.center = this.toXYZ(this.m.getCenter());
    });
  }

  private initBaseMap() {
    // Add a base image to make tile loading less noticeable.
    const BASE_PANE = 'base';
    this.m.createPane(BASE_PANE).style.zIndex = '0';
    const southWest = this.rc.unproject([0, this.rc.height]);
    const northEast = this.rc.unproject([this.rc.width, 0]);
    const bounds = new L.LatLngBounds(southWest, northEast);
    const baseImage = L.imageOverlay(`${map.GAME_FILES}/maptex/base.png`, bounds, {
      pane: BASE_PANE,
    });
    baseImage.addTo(this.m);

    this.baseMapLayers = {};
    for (const area of AREAS) {
      const zarea = (area == "Surface") ? "Ground" : area;
      const baseLayer = L.tileLayer(`${TOTK_MAP}/${zarea}/maptex/{z}/{x}/{y}.webp`, {
        maxNativeZoom: 7,
      });
      this.baseLayer.push(baseLayer);
      this.baseMapLayers[area] = baseLayer;
    }
    this.baseMapLayers.Surface.addTo(this.m);

    // Empty Basemap (has the tower outlines included)
    //    If desired, this can be added
    //baseMaps.Empty = L.tileLayer(`${map.GAME_FILES}/totk/Empty/maptex/{z}/{x}/{y}.png`, {
    //  maxNativeZoom: 7
    //});
    this.m.createPane('front').style.zIndex = '1001';
    this.m.createPane('front2').style.zIndex = '1002';

    // Basic Switching
    L.control.layers(this.baseMapLayers).addTo(this.m);

    // Opacity Switching
    //   Having control over the tile layer opacity is fun, but is it useful
    //   Left here as an appendage; if requested and there is demand
    // L.control.opacity(baseMaps, { label: '', collapsed: true }).addTo(this.m);

    // Mouse Position (bottom right corner)
    L.control.mousePosition({
      lngFirst: true,
      wrapLng: false,
      position: 'bottomright',
      latFormatter: (x) => (-x).toFixed(0),
      lngFormatter: (x) => x.toFixed(0),
    }).addTo(this.m);
    this.m.on('baselayerchange', (ev: any) => {
      const url = ev.layer._url;
      this.activeLayer = AREAS.find(area => url.includes(area)) || "Surface";
      this.m.fireEvent('objmap:base-layer-change');
    });

    // Keyboard control over Layer switching
    this.m.on('keyup', (ev: any) => {
      const moveUp = ['PageUp'];
      const moveDown = ['PageDown'];
      const move: { [key: string]: string } = {
        'F1': 'Sky',
        'F2': 'Surface',
        'F3': 'Depths',
      }
      var charCode = ev.originalEvent.code;
      if (charCode in move) {
        this.switchBaseTileLayer(move[charCode]);
      } else if (moveUp.includes(charCode)) {
        this.switchBaseTileLayerDir(-1);
      } else if (moveDown.includes(charCode)) {
        this.switchBaseTileLayerDir(1);
      }
    });
  }
  svgIconBase(width: number) {
    return L.divIcon({
      html: `<svg  viewBox="0 0 100 100" version="1.1"
preserveAspectRatio="none"  xmlns="http://www.w3.org/2000/svg" >
<path d="M 100 50 L 0 50 M 50 0 L 50 100" stroke="#60B0E0" stroke-width="${width}" />
</svg>`,
      className: "",
      iconSize: [10, 10],
      iconAnchor: [5, 5],
    });
  }
  createMarkers() {
    const svgIcon = this.svgIconBase(3);
    const svgIcon2 = this.svgIconBase(6);
    const svgIcon3 = this.svgIconBase(12);
    let size = 125;
    let markers = [L.layerGroup(), L.layerGroup(), L.layerGroup(), L.layerGroup()];
    for (let i = 0; i < 20 * 4; i++) {
      for (let j = 0; j < 16 * 4; j++) {
        let z = -4000 + j * size + 125 / 2;
        let x = -5000 + i * size + 125 / 2;
        let k = 2;
        let icon = svgIcon;
        if (i % 4 == 0 && j % 4 == 0) {
          icon = svgIcon3;
          k = 0;
        } else if (i % 4 == 0 || j % 4 == 0) {
          icon = svgIcon2;
          k = 1;
        }
        markers[k].addLayer(L.marker([z, x], { icon }));
      }
    }
    this.loadTowerAreas();
    return markers;
  }

  private setZoomProp(zoom: number) {
    this.zoom = zoom;
    for (const cb of this.zoomChangeCbs)
      cb(zoom);
  }

  switchBaseTileLayer(name: string) {
    if (this.activeLayer == name) {
      return;
    }

    this.m.removeLayer(this.baseMapLayers[this.activeLayer]);
    this.baseMapLayers[name].addTo(this.m);
    this.activeLayer = name;
  }

  switchBaseTileLayerDir(dir: -1 | 1) {
    const k = AREAS.findIndex(area => area == this.activeLayer);
    if (k + dir < 0 || k + dir >= AREAS.length)
      return;

    this.switchBaseTileLayer(AREAS[k + dir]);
  }
}
