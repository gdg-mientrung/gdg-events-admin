<template>
  <div>
    <a-button html-type="submit" @click="onNavigateCreate">Create</a-button>
    <a-table
      :columns="columns"
      :rowKey="eventDate => eventDate.id"
      :dataSource="eventDates"
      :pagination="pagination"
      :loading="isLoading"
      @change="handleTableChange"
      :customRow="customRow"
    >
      <template slot="id" slot-scope="id">{{id.substring(0, 6) + '...'}}</template>
      <template slot="date" slot-scope="date">{{date.format('L')}}</template>
    </a-table>
  </div>
</template>
<script lang="ts">
import {
  Vue,
  Component,
  State,
  Action,
  Getter,
  namespace
} from "nuxt-property-decorator";
import { plainToClass } from "class-transformer";
import { Pagination } from "ant-design-vue";
const eventDatesStore = namespace("eventDates");

@Component({})
export default class extends Vue {
  @eventDatesStore.Action fetchEventDates;
  @eventDatesStore.Getter isLoading;
  @eventDatesStore.Getter eventDates;

  pagination = {
    pageSize: 10,
    showSizeChanger: true,
    pageSizeOptions: ["10", "15", "20", "50", "100"],
    showTotal: total => `Total ${total} items`
  };
  columns: any[] = [
    {
      title: "Id",
      dataIndex: "id",
      scopedSlots: { customRender: "id" }
    },
    {
      title: "Date",
      dataIndex: "date",
      sorter: true,
      defaultSortOrder: "ascend",
      scopedSlots: { customRender: "date" }
    },
    {
      title: "Name",
      dataIndex: "name",
      sorter: true
    }
  ];
  customRow(record) {
    return {
      on: {
        click: () => this.navigateToEventDate(record.id)
      }
    };
  }

  navigateToEventDate(id: string) {
    this.$router.push({
      name: "schedules-id",
      params: { id }
    });
  }

  onNavigateCreate() {
    this.$router.push({
      name: "schedules-create"
    });
  }
  onChange(a, b, c) {
    console.log(a, b, c);
  }
  mounted() {
    this.fetchEventDates({
      pagination: this.pagination
    });
  }
  handleTableChange(pagination, filters, sorter) {
    this.fetchEventDates({ pagination, filters, sorter });
  }
}
</script>

<style scoped>
</style>