import Component, { mixins } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import MixinUtil from '@/components/MixinUtil';
import {
  isDefaultDropTable,
  ObjectData,
  ObjectMinData,
} from '@/services/MapMgr';
import { MsgMgr } from '@/services/MsgMgr';
import { Settings } from '@/util/settings';

@Component
export default class ObjectInfo extends mixins(MixinUtil) {
  @Prop()
  private obj!: ObjectData | ObjectMinData | null;

  @Prop({ type: String, default: 'search-result' })
  private className!: string;

  @Prop({ type: Boolean, default: true })
  private isStatic!: boolean;

  @Prop({ type: Boolean, default: false })
  private dropAsName!: boolean;

  @Prop({ type: Boolean, default: false })
  private withPermalink!: boolean;

  private data!: ObjectData | ObjectMinData;

  private metadata: any | null = null;

  private isChecked: boolean = false;

  private created() {
    if (this.obj)
      this.data = this.obj;
    this.isChecked = this.isCheckedInSettings();
  }
  private isCheckedInSettings() {
    const item = Settings.getInstance().checklists[this.data.hash_id];
    if (item && item.marked) {
      return true;
    }
    return false;
  }
  toggleCheck() {
    const settings = Settings.getInstance();
    if (!(this.data.hash_id in settings.checklists)) {
      settings.checklists[this.data.hash_id] = { ... this.data };
      settings.checklists[this.data.hash_id].marked = false;
      settings.checklists[this.data.hash_id].name = this.name(true);
    }
    const item = settings.checklists[this.data.hash_id];
    item.marked = !item.marked;
    this.isChecked = item.marked;
    this.$parent.$emit('AppMap:update-search-markers', item);
  }
  async loadMetaIfNeeded() {
    if (!this.metadata) {
      const rname = this.getRankedUpActorNameForObj(this.data);
      this.metadata = await MsgMgr.getInstance().getObjectMetaData(rname);
    }
  }

  private meta(item: string) {
    this.loadMetaIfNeeded();
    // Return values may still be null if metadata is not available
    return (this.metadata) ? this.metadata[item] : null;
  }


  private name(rankUp: boolean) {
    if (this.dropAsName)
      return this.drop();

    const objName = this.data.name;
    if ((objName === 'LocationMarker' || objName == 'LocationArea') && this.data.Location) {
      const locationName = MsgMgr.getInstance().getMsgWithFile('StaticMsg/LocationMarker', this.data.Location)
        || MsgMgr.getInstance().getMsgWithFile('StaticMsg/Dungeon', this.data.Location);
      return `Location: ${locationName}`;
    }

    return this.getName(rankUp ? this.getRankedUpActorNameForObj(this.data) : this.data.name);
  }

  private isHardMode() {
    return Settings.getInstance().hardMode;
  }

  private drop() {
    let s = '';
    if (!this.data.drop)
      return s;

    s += this.data.drop.type == "Table" ? 'Drop table: ' : '';
    s += this.data.drop.value.map((name: any) => this.getName(name)).join(", ");

    return s;
  }

  hasNonDefaultDropTable() {
    if (!this.data.drop) {
      return false;
    }
    return !isDefaultDropTable(this.data.drop);
  }
}
