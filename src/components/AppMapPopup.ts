
import { defineComponent } from 'vue';

export interface AppMapPopupProps {
  title?: string;
  text?: string;
  pathLength?: number;
  mapLayer?: string;
}

export default defineComponent({
  name: 'AppMapPopup',
  props: {
    title: String,
    text: String,
    pathLength: Number,
    mapLayer: String,
  },
  emits: ['title', 'text', 'mapLayer'],

  data() {
    return {
      currentTitle: this.title,
      currentText: this.text,
      currentMapLayer: this.mapLayer || "Surface",
    }
  },

  watch: {
    currentTitle(val: string) {
      this.$emit('title', val);
    },
    currentText(val: string) {
      this.$emit('text', val);
    },
    currentMapLayer(val: string) {
      this.$emit('mapLayer', val);
    }
  },
})
