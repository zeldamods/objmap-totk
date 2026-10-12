import { defineComponent } from 'vue'
import MixinUtil from '@/components/MixinUtil';
import * as ui from '@/util/ui';

export default defineComponent({
  name: 'RewardData',
  props: {
    data: { type: Object, default: {} },
  },
  methods: {
    length() {
      return Object.keys(this.data).filter(key => key.startsWith("CraftSignboardR")).length
    },
    item(i: number) {
      const n = (i > 1) ? i.toString() : ""
      return this.data[`CraftSignboardReward${n}`]
    },
    name(i: number) {
      return ui.getName(this.item(i))
    }
  },
})
