import Component, { mixins } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import MixinUtil from '@/components/MixinUtil';
import {
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

  private created() {
    if (this.obj)
      this.data = this.obj;
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
}
