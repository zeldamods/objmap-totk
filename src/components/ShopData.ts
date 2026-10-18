import { defineComponent, PropType } from 'vue'
import * as ui from '@/util/ui';

export default defineComponent({

  name: 'ShopData',
  props: {
    data: { type: Object as PropType<Record<string, any>> },
    shop_ui_name: { type: String as PropType<string | null>, default: null },
  },
  data() {
    return {
      table: "Normal",
    };
  },
  created() {
    if(Object.keys(this.data || []).length) {
      if(this.data!.Normal) {
        this.table = "Normal"
      } else {
        this.table = Object.keys(this.data!)[0]
      }
    }
  },
  methods: {
    length() {
      return this.data!.items.length;
    },
    item(i: number) {
      return this.data!.items[i - 1];
    },
    name(i: number) {
      return ui.getName(this.item(i).Name)
    },
    num(i: number) {
      return this.item(i).StockNum;
    },
    price(i: number) {
      return this.item(i).Price;
    },
    currency(i: number) {
      return this.item(i).Currency;
    },
    has_condition(i: number) {
      return this.item(i).ReleaseRequirements !== undefined;
    },
    condition_type(i: number) {
      const it = this.item(i).ReleaseRequirements;
      if (!it)
        return false
      if (it.IsCheckReleaseGameData && it.ReleaseGameData)
        return "GameData"
      if (it.IsCheckGetFlag)
        return "GetFlag"
      if (it.IsCheckReleaseWeather || it.IsCheckUnReleaseWeather)
        return this.weather(i)
      return false
    },
    game_data(i: number) {
      const r = this.item(i).ReleaseRequirements;
      if (!r || !r.ReleaseGameData)
        return ""
      return r.ReleaseGameData;
    },
    weather_text(i: number) {
      const it = this.item(i).ReleaseRequirements;
      if (!it)
        return "";
      if (it.IsCheckReleaseWeather && it.ReleaseWeather) {
        return `ReleaseWeather: ${it.ReleaseWeather}`
      }
      if (it.IsCheckUnReleaseWeather && it.UnReleaseWeather) {
        return `UnReleaseWeather: ${it.UnReleaseWeather}`
      }
      return ""
    },
    weather(i: number) {
      const not: any = {
        Rainy: 'Sunny',
        Stormy: 'Sunny',
      }
      const it = this.item(i).ReleaseRequirements;
      if (!it)
        return "";
      if (it.IsCheckReleaseWeather && it.ReleaseWeather) {
        return it.ReleaseWeather
      }
      if (it.IsCheckUnReleaseWeather && it.UnReleaseWeather)
        if (it.UnReleaseWeather in not)
          return not[it.UnReleaseWeather]
      return ""
    }
  }
})
