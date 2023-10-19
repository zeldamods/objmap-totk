import Vue from 'vue'
import Component, { mixins } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import MixinUtil from '@/components/MixinUtil';
import * as ui from '@/util/ui';

@Component
export default class ShopData extends mixins(MixinUtil) {
  @Prop()
  private data!: any;

  length() {
    console.log(this.data)
    return this.data.items.length;
  }
  item(i: number) {
    return this.data.items[i - 1];
  }
  name(i: number) {
    return ui.getName(this.item(i).Name)
    //const n = i.toString().padStart(3, '0')
    //return ui.getName(this.data.Normal[`ItemName${n}`]);
  }
  num(i: number) {
    return this.item(i).StockNum;
    //const n = i.toString().padStart(3, '0')
    //return this.data.Normal[`ItemNum${n}`];
  }
  price(i: number) {
    return this.item(i).Price;
    //const n = i.toString().padStart(3, '0')
    //return this.data.Normal[`ItemPrice${n}`];
  }
  currency(i: number) {
    return this.item(i).Currency;
  }
  has_condition(i: number) {
    return this.item(i).ReleaseRequirements !== undefined;
  }
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
  }
  game_data(i: number) {
    const r = this.item(i).ReleaseRequirements;
    if (!r || !r.ReleaseGameData)
      return ""
    return r.ReleaseGameData;
  }
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
  }
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
