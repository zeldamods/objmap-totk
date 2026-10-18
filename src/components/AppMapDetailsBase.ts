import { defineComponent, PropType } from 'vue';

import MixinUtil from '@/components/MixinUtil';
import { Settings } from '@/util/settings';

export function defineDetailsBase<MarkerClass>() {
  return defineComponent({
    name: 'AppMapDetailsBase',
    mixins: [MixinUtil],
    props: {
      marker: { type: Object as PropType<MarkerClass>, required: true },
    },
    watch: {
      marker() { this.init(); },
    },
    created() {
      this.init();
    },
    methods: {
      init(): void | Promise<void> {

      },
      formatPosition(pos: number[]): string {
        const inGame = Settings.getInstance().inGameCoordinates
        let xyz = [pos[0], pos[1], -pos[2]] // E-W, U-D, N-S
        if (inGame)
          xyz = [pos[0], -pos[2], pos[1] - 106] // E-W, N-S, U-D -160
        return xyz.map(v => v.toFixed(2)).join(", ")
      }
    },
  });
}
