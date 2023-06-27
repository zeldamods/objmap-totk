import Vue from 'vue';
import { Prop, Watch } from 'vue-property-decorator';
import Component from 'vue-class-component';
import { Settings } from '@/util/settings';
import { MapMgr, ObjectMinData } from '@/services/MapMgr';
import { MsgMgr } from '@/services/MsgMgr';
import * as ui from '@/util/ui';

@Component({
  components: {
    //ObjectInfo,
  },
})
export default class AppMapChecklistItem extends Vue {
  @Prop()
  private item!: any;

  searchOnHash() {
    this.$parent.$emit('AppMap:search-on-hash', this.item.hash_id);
  }
  searchOnValue() {
    this.$parent.$emit('AppMap:search-on-value', this.item.hash_id);
  }

  itemChange() {
    this.$parent.$emit('AppMap:update-search-markers', {
      hash_id: this.item.hash_id,
      label: "",
    });

  }
}

