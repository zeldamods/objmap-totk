import Vue, { defineComponent } from 'vue';
import { Settings } from '@/util/settings';
import { MapMgr, ObjectMinData } from '@/services/MapMgr';
import { MsgMgr } from '@/services/MsgMgr';
import * as ui from '@/util/ui';
import AppMapChecklistItem from '@/components/AppMapChecklistItem';
import { appMapBus } from '@/util/bus';

// @ts-ignore
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';

export default defineComponent({
  name: 'AppMapChecklists',
  components: {
    AppMapChecklistItem,
    DynamicScroller,
    DynamicScrollerItem
  },

  props: {
    lists: { default: [] },
  },
  
  data() {
    return {
      activeList: -1,
      xlist: {},
    };
  },

  created() {
    // EventBus used here as there is an intermediate component
    //   that does not forward events from the child to the parent
    this.$on('AppMap:search-on-hash', (value: string) => {
      appMapBus.emit('AppMap:search-on-hash', value);
    });
    this.$on('AppMap:search-on-value', (value: string) => {
      appMapBus.emit('AppMap:search-on-value', value);
    });
    this.$on('AppMap:update-search-markers', (value: any) => {
      appMapBus.emit('AppMap:update-search-markers', value);
    });
    this.activeList = -1;
    this.xlist = {};
  },
  methods: {
    back() {
      this.activeList = -1;
      this.xlist = {};
    },
    checkopen(list: any) {
      this.activeList = list.id;
      this.xlist = list;
      this.$nextTick();
    },

    markedLength(list: any) {
      return Object.values(list.items).filter((item: any) => item.marked).length
    },
    
    length(list: any) {
      return Object.keys(list.items).length;
    },

    meta(list: any) {
      const total = this.length(list);
      if (total == 0) {
        return `0 / 0`;
      }
      const marked = this.markedLength(list);
      const percent = (100 * marked / total).toFixed(2);
      return `${marked} / ${total} (${percent}%)`
    },

    percent(list: any) {
      const n = this.markedLength(list)
      return (100 * n / this.length(list)).toFixed(2);
    },

    show(list: any) {
      appMapBus.emit('AppMap:search-add-group', { name: list.name, query: list.query });
    },

    remove(list: any) {
      appMapBus.emit('AppMap:checklist-remove', list)
      this.back();
    },
    reset() {
      appMapBus.emit('AppMap:checklist-reset')
    },
    create() {
      appMapBus.emit('AppMap:checklist-create')
    },
    changeName(list: any) {
      appMapBus.emit('AppMap:update-checklist-name', { id: list.id, name: list.name, });
    },
    changeQuery(list: any) {
      appMapBus.emit('AppMap:update-checklist-query', { id: list.id, query: list.query });
    },
  }
})

