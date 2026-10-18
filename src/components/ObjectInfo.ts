
import { defineComponent, PropType } from 'vue';
import MixinUtil from '@/components/MixinUtil';
import {
  isDefaultDropTable,
  ObjectData,
  ObjectMinData,
} from '@/services/MapMgr';
import { MsgMgr } from '@/services/MsgMgr';
import { Settings } from '@/util/settings';
import { appMapBus } from '@/util/bus';

export default defineComponent({
  name: 'ObjectInfo',
  mixins: [MixinUtil],
  props: {
    obj: { type: Object as PropType<ObjectData | ObjectMinData | null>, default: null},
    className: { type: String, default: 'search-result' },
    isStatic: { type: Boolean, default: true },
    dropAsName: { type: Boolean, default: false },
    withPermalink: { type: Boolean, default: false },
    isChecked: { type: Boolean, default: false },
  },
  emits: ['click'],

  data() {
    return {
      metadata: null as any
    }
  },

  computed: {
    data: {
      get: function(): ObjectData | ObjectMinData {
        return this.obj!
      },
      set: function(newValue: any) { },
    }
  },

  watch: {
    data() {
      this.metadata = null;
    },
  },

  created() {
    if (this.obj)
      this.data = this.obj;
  },

  methods: {
    toggleCheck() {
      appMapBus.emit('AppMap:update-search-markers', {
        hash_id: this.data.hash_id
      });
    },
    async loadMetaIfNeeded() {
      if (!this.metadata) {
        const rname = this.getRankedUpActorNameForObj(this.data);
        this.metadata = await MsgMgr.getInstance().getObjectMetaData(rname);
      }
    },
    meta(item: string): any {
      this.loadMetaIfNeeded();
      // Return values may still be null if metadata is not available
      return (this.metadata) ? this.metadata[item] : null;
    },
    name(rankUp: boolean): string {
      if (this.dropAsName)
        return this.drop();

      const objName = this.data.name;
      if ((objName === 'LocationMarker' || objName == 'LocationArea') && this.data.Location) {
        const locationName = MsgMgr.getInstance().getMsgWithFile('StaticMsg/LocationMarker', this.data.Location)
          || MsgMgr.getInstance().getMsgWithFile('StaticMsg/Dungeon', this.data.Location);
        return `Location: ${locationName}`;
      }

      return this.getName(rankUp ? this.getRankedUpActorNameForObj(this.data) : this.data.name);
    },

    isHardMode() {
      return Settings.getInstance().hardMode;
    },

    drop() {
      let s = '';
      if (!this.data.drop)
        return s;

      s += this.data.drop.type == "Table" ? 'Drop table: ' : '';
      s += this.data.drop.value.map((name: any) => this.getName(name)).join(", ");

      return s;
    },

    hasNonDefaultDropTable() {
      if (!this.data.drop) {
        return false;
      }
      return !isDefaultDropTable(this.data.drop);
    },
  }
})

