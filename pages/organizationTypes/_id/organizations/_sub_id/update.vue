<template>
  <a-spin :spinning="isLoading || isUpdating || isUploadingImage" :delay="0">
    <a-form :form="form" @submit="handleSubmit" v-if="organization!=null">
      <a-form-item label="Name" :label-col="{ span: 5 }" :wrapper-col="{ span: 12 }">
        <a-input
          v-decorator="[
          'name',
          { initialValue: organization.name ,
            rules: [
          { required: true, message: 'Please input name!' }]}
        ]"
        />
      </a-form-item>

      <a-form-item label="Photo" :label-col="{ span: 5 }" :wrapper-col="{ span: 12 }">
        <div class="dropbox">
          <a-upload
            name="avatar"
            listType="picture-card"
            class="avatar-uploader"
            :showUploadList="false"
            :action="uploadFile"
            :beforeUpload="beforeUpload"
            @change="handleChange"
          >
            <img
              v-if="photoURL || organization.photo_url"
              :src="photoURL|| organization.photo_url"
              alt="avatar"
              class="avatar-image"
            />
            <div v-else class="upload-image-area">
              <a-icon :type="loading ? 'loading' : 'plus'" />
              <div class="ant-upload-text">Upload</div>
            </div>
          </a-upload>
        </div>
      </a-form-item>

      <a-form-item :wrapper-col="{ span: 12, offset: 5 }">
        <a-button type="primary" html-type="submit">Edit</a-button>
        <a-button class="danger-wrapper" type="danger" @click.prevent="onDelete">Delete</a-button>
      </a-form-item>
    </a-form>
  </a-spin>
</template>

<script lang="ts">
import {
  Vue,
  Component,
  State,
  Action,
  Getter,
  namespace,
  Watch
} from "nuxt-property-decorator";
import { plainToClass } from "class-transformer";
import { Form } from "ant-design-vue";
import { st } from "~/plugins/firebase";
import * as firebase from "firebase/app";
import { Organization } from "~/modals";

const organizationStore = namespace("organization");

@Component({})
export default class extends Vue {
  @organizationStore.Action fetchOrganization;
  @organizationStore.Action updateOrganization;
  @organizationStore.Action deleteOrganization;
  @organizationStore.Getter isLoading;
  @organizationStore.Getter isUpdating;
  @organizationStore.Getter isDeleting;
  @organizationStore.Getter organization;

  formLayout = "horizontal";
  form: any;
  photoURL: string = "";
  isUploadingImage: boolean = false;

  async handleSubmit(e) {
    e.preventDefault();
    this.$confirm({
      title: "Do you want to update?",
      content: "This cannot be undone",
      onOk: () => {
        this.submit();
      },
      onCancel: () => {}
    });
  }
  submit() {
    this.form.validateFields(async (err, values) => {
      if (!err) {
        const organization: Organization = {
          ...this.organization,
          ...values,
          photo_url: this.photoURL || this.organization.photo_url
        };
        console.log("Received values of form: ", values);
        await this.updateOrganization({
          id: this.$route.params.id,
          organization
        });
        this.navigateToOrganization(this.$route.params.id);
      }
    });
  }

  loading = false;
  imageUrl = "";
  handleChange(info) {
    if (info.file.status === "uploading") {
      this.loading = true;
      return;
    }
    if (info.file.status === "done") {
      // Get this url from response in real world.
      this.getBase64(info.file.originFileObj, imageUrl => {
        this.imageUrl = imageUrl;
        this.loading = false;
      });
    }
  }

  beforeUpload(file) {
    const isJPG = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJPG) {
      this.$message.error("You can only upload JPG/PNG file!");
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      this.$message.error("Image must smaller than 2MB!");
    }
    return isJPG && isLt2M;
  }
  async uploadFile(file: File) {
    var storageRef = st.ref();
    const timestamp: number = new Date().getTime();
    var organizationAvatar = storageRef.child(
      `organization_avatars/${file.name}_${timestamp}`
    );
    const uploadTask: firebase.storage.UploadTask = organizationAvatar.put(
      file
    );
    var subscribe = uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED);
    this.isUploadingImage = true;
    subscribe({
      next: async (snapshot: firebase.storage.UploadTaskSnapshot) => {
        var percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (percent === 100) {
          const ref: firebase.storage.Reference = snapshot.ref;
          this.photoURL = await ref.getDownloadURL();
        }

        console.log(percent + "% done");
      },
      error: error => {},
      complete: () => {
        this.isUploadingImage = false;
      }
    });
  }

  created() {
    this.form = this.$form.createForm(this);
  }
  mounted() {
    this.fetchOrganization(this.$route.params.id);
  }
  onDelete() {
    this.showDeleteConfirm();
  }
  showDeleteConfirm() {
    this.$confirm({
      title: "Are you sure to delete ?",
      content: "This cannot be undone",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk: this.onDeleteOrganization,
      onCancel: () => {}
    });
  }
  async onDeleteOrganization() {
    const isSuccess: boolean = await this.deleteOrganization({
      typeId: this.$route.params.id,
      id: this.$route.params.sub_id
    });
    if (isSuccess) this.navigateToOrganizations();
  }
  navigateToOrganization(id: string) {
    this.$router.push({
      name: "organizationTypes-id-organizations-sub_id",
      params: { id: this.$route.params.id, sub_id: id }
    });
  }
  navigateToOrganizations() {
    this.$router.push({
      name: "organizationTypes-id",
      params: { id: this.$route.params.id }
    });
  }
}
</script>

<style scoped>
.danger-wrapper {
  display: inherit;
  margin-left: 10px;
}
</style>