import Component from 'vue-class-component';

import AppMapDetailsBase from '@/components/AppMapDetailsBase';
import ObjectInfo from '@/components/ObjectInfo';
import { MapMarkerDungeon } from '@/MapMarker';
import {
  MapMgr,
  ObjectMinData,
} from '@/services/MapMgr';
import { MsgMgr } from '@/services/MsgMgr';

@Component({
  components: {
    ObjectInfo,
  },
})
export default class AppMapDetailsDungeon extends AppMapDetailsBase<MapMarkerDungeon> {
  private id = '';
  private sub = '';
  private tboxObjs: ObjectMinData[] = [];
  private enemies: ObjectMinData[] = [];
  private pos: number[] = [];

  protected init() {
    this.id = this.marker.data.lm.getMessageId();
    this.sub = MsgMgr.getInstance().getMsgWithFile('StaticMsg/Dungeon', this.id + '_sub');

    MapMgr.getInstance().getObjs('SmallDungeon', this.id, 'actor:^"TBox_"').then(d => this.tboxObjs = d);
    MapMgr.getInstance().getObjs('SmallDungeon', this.id, 'actor:^"Enemy_"').then(d => this.enemies = d);
    this.pos = this.marker.data.lm.getXYZ();
  }
}
