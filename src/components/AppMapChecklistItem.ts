import { defineComponent,PropType } from 'vue';
import { Settings } from '@/util/settings';
import { MapMgr, ObjectMinData } from '@/services/MapMgr';
import { MsgMgr } from '@/services/MsgMgr';
import * as ui from '@/util/ui';
import { appMapBus } from '@/util/bus';
import { ListItem } from '@/util/Checklist';

export default defineComponent({
  name: 'AppMapChecklistItem',
  props: {
    item: {type: Object as ListItem, default() { return {} } },
  },
  methods: {
    searchOnHash() {
      appMapBus.emit('AppMap:search-on-hash', this.item!.hash_id);
    },
    searchOnValue() {
      appMapBus.emit('AppMap:search-on-value', this.item!.hash_id);
    },
    itemChange() {
      appMapBus.emit('AppMap:update-search-markers', {
        hash_id: this.item!.hash_id
      });
    }
  },
})

