import Vue from 'vue';
import { Prop } from 'vue-property-decorator';
import Component, { mixins } from 'vue-class-component';

import MixinUtil from '@/components/MixinUtil';
import { ObjectMinData } from '@/services/MapMgr';
import * as ui from '@/util/ui';
import { Settings } from '@/util/settings';

@Component({
  watch: {
    // @ts-ignore
    marker: function() { this.init(); },
  }
})
export default class AppMapDetailsBase<MarkerClass> extends mixins(MixinUtil) {
  @Prop()
  protected marker!: ui.Unobservable<MarkerClass>;
  protected init() { }

  private created() {
    this.init();
  }
  formatPosition(pos: number[]): string {
    const inGame = Settings.getInstance().inGameCoordinates
    let xyz = [pos[0], pos[1], -pos[2]] // E-W, U-D, N-S
    if (inGame)
      xyz = [pos[0], -pos[2], pos[1] - 106] // E-W, N-S, U-D -160
    return xyz.map(v => v.toFixed(2)).join(", ")
  }
}
