import { defineComponent } from 'vue'

import { defineDetailsBase } from '@/components/AppMapDetailsBase';
import ObjectInfo from '@/components/ObjectInfo.vue';
import { MapMarkerDungeon } from '@/MapMarker';
import {
  MapMgr,
  ObjectMinData,
} from '@/services/MapMgr';
import { MsgMgr } from '@/services/MsgMgr';

export default defineComponent({
  name: 'AppMapDetailsDungeon',
  components: {
    ObjectInfo,
  },
  extends: defineDetailsBase<MapMarkerDungeon>(),
  data() {
    return {
      id: '',
      sub: '',
      tboxObjs: [] as ObjectMinData[],
      enemies: [] as ObjectMinData[],
      pos: [] as number[],
    };
  },

  methods: {
    init() {
      this.id = this.marker.lm.getMessageId();
      this.sub = MsgMgr.getInstance().getMsgWithFile('StaticMsg/Dungeon', this.id + '_sub');

      MapMgr.getInstance().getObjs('SmallDungeon', this.id, 'actor:^"TBox_"').then(d => this.tboxObjs = d);
      MapMgr.getInstance().getObjs('SmallDungeon', this.id, 'actor:^"Enemy_"').then(d => this.enemies = d);
      this.pos = this.marker.lm.getXYZ();
    },
  },
})
