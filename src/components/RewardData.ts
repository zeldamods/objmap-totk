import Vue from 'vue'
import Component, { mixins } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import MixinUtil from '@/components/MixinUtil';
import * as ui from '@/util/ui';

@Component
export default class RewardData extends mixins(MixinUtil) {
  @Prop()
  private data!: any;

  length() {
    return Object.keys(this.data).filter(key => key.startsWith("CraftSignboardR")).length
  }
  item(i: number) {
    const n = (i > 1) ? i.toString() : ""
    return this.data[`CraftSignboardReward${n}`]
  }
  name(i: number) {
    return ui.getName(this.item(i))
  }
}
