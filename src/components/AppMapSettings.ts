import Vue from 'vue';

import Component from 'vue-class-component';

import { MsgMgr } from '@/services/MsgMgr';
import { Settings } from '@/util/settings';

function makeCDungeonEntry(n: number) {
  const mapName = 'Dungeon' + n.toString().padStart(3, '0');
  const text = MsgMgr.getInstance().getMsg(`StaticMsg/Dungeon:${mapName}`);
  const sub = MsgMgr.getInstance().getMsg(`StaticMsg/Dungeon:${mapName}_sub`);
  return { value: mapName, text: `${text} (${mapName} - ${sub})` };
}

@Component
export default class AppMapSettings extends Vue {
  colorMode: string = '';
  s: Settings | null = null;

  optionsMapType = Object.freeze([
    { value: 'MainAndMinusField', text: 'Sky, Surface and Depths' },
    { value: 'SmallDungeon', text: 'Shrines (SmallDungeon)' },
    { value: 'LargeDungeon', text: 'Temples (LargeDungeon)' },
    { value: 'NormalStage', text: 'Special Maps (NormalStage)' },
    { value: 'MainField', text: 'Sky and Surface (MainField)' },
    { value: 'MinusField', text: 'Depths (MinusField)' },
  ]);

  optionsMapNameForMapType: { [type: string]: any } = Object.freeze({
    'MainAndMinusField': [
      { value: '', text: 'All' },
    ],
    'SmallDungeon': [{ value: '', text: 'All' }].concat([...Array(152).keys()].map(makeCDungeonEntry)),
    'LargeDungeon': [
      { value: 'LargeDungeonFire', text: 'Fire Temple' },
      { value: 'LargeDungeonThunder', text: 'Lightning Temple' },
      { value: 'LargeDungeonWater', text: 'Water Temple' },
      { value: 'LargeDungeonWind', text: 'Wind Temple' },
      { value: 'LargeDungeonSoul', text: 'Spirit Temple' },
      { value: 'LargeDungeonHyruleCastle', text: 'Hyrule Castle (Sky)' },
    ],
    'NormalStage': [
      { value: 'OpeningField', text: 'Prologue (OpeningField)' },
      { value: 'TitleScene', text: 'TitleScene' },
    ],
    'MainField': [
      { value: '', text: 'All' },
      { value: 'Surface', text: 'Surface' },
      { value: 'Sky', text: 'Sky' },
      { value: 'Cave', text: 'Cave' },
      { value: 'DeepHole', text: 'Chasms' },
    ],
    'MinusField': [
      { value: '', text: 'All' },
    ]
  });

  created() {
    this.s = Settings.getInstance();
    Settings.getInstance().registerCallback(() => this.loadSettings());
    this.loadSettings();
  }

  toggleY() {
    this.$parent.$emit('AppMap:toggle-y-values');
  }

  private loadSettings() {
    this.colorMode = Settings.getInstance().colorPerActor ? 'per-actor' : 'per-group';
  }

  private onColorModeChange(mode: string) {
    Settings.getInstance().colorPerActor = mode === 'per-actor';
  }

  private resetMapName() {
    this.s!.mapName = this.optionsMapNameForMapType[this.s!.mapType][0].value;
  }
}
