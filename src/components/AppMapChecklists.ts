import Vue from 'vue';
import { Prop, Watch } from 'vue-property-decorator';
import Component from 'vue-class-component';
import { Settings } from '@/util/settings';
import { MapMgr, ObjectMinData } from '@/services/MapMgr';
import { MsgMgr } from '@/services/MsgMgr';
import * as ui from '@/util/ui';
import AppMapChecklistItem from '@/components/AppMapChecklistItem';

@Component({
  components: {
    AppMapChecklistItem
  },
})
export default class AppMapChecklists extends Vue {
  @Prop()
  private lists!: any[];

  private showItems: boolean = false;

  created() {
    this.$on('AppMap:search-on-hash', (value: string) => {
      this.$parent.$emit('AppMap:search-on-hash', value);
    });
    this.$on('AppMap:search-on-value', (value: string) => {
      this.$parent.$emit('AppMap:search-on-value', value);
    });
    this.$on('AppMap:update-search-markers', (value: any) => {
      this.$parent.$emit('AppMap:update-search-markers', value);
    });
  }

  checkopen() {
    if (!this.showItems) {
      this.showItems = true;
    }
  }
  markedLength(list: any) {
    return Object.values(list.items).filter((item: any) => item.marked).length
  }

  length(list: any) {
    return Object.keys(list.items).length;
  }

  meta(list: any) {
    const total = this.length(list);
    if (total == 0) {
      return `0 / 0`;
    }
    const marked = this.markedLength(list);
    const percent = (100 * marked / total).toFixed(2);
    return `${marked} / ${total} (${percent}%)`
  }

  percent(list: any) {
    const n = this.markedLength(list)
    return (100 * n / this.length(list)).toFixed(2);
  }

  show(list: any) {
    this.$parent.$emit('AppMap:search-add-group', { name: list.name, query: list.query });
  }

  remove(list: any) {
    this.$parent.$emit('AppMap:checklist-remove', list)
  }

  changeName(list: any) {
    this.$parent.$emit('AppMap:update-checklist-name', { id: list.id, name: list.name, });
  }

  changeQuery(list: any) {
    this.$parent.$emit('AppMap:update-checklist-query', { id: list.id, query: list.query });
  }

}

