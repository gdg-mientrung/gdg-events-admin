<template>
  <a-spin :spinning="isLoading || isUpdating || isUploadingImage" :delay="0">
    <a-form :form="form" @submit="handleSubmit" v-if="mentor!=null">
      <a-form-item label="Order" :label-col="{ span: 5 }" :wrapper-col="{ span: 12 }">
        <a-input
          v-decorator="[
          'order',
          { initialValue: mentor.order ,
            rules: [
          { required: true, message: 'Please input order!' }]}
        ]"
        />
      </a-form-item>

      <a-form-item label="Name" :label-col="{ span: 5 }" :wrapper-col="{ span: 12 }">
        <a-input
          v-decorator="[
          'name',
          { initialValue: mentor.name ,
            rules: [
          { required: true, message: 'Please input name!' }]}
        ]"
        />
      </a-form-item>

      <a-form-item label="Title" :label-col="{ span: 5 }" :wrapper-col="{ span: 12 }">
        <a-input
          v-decorator="[
          'title',
          { initialValue: mentor.title ,
            rules: [{ required: true, message: 'Please input title!' }]}
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
              v-if="photoURL || mentor.photo_url"
              :src="photoURL|| mentor.photo_url"
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
import { Mentor } from "~/modals";

const mentorStore = namespace("mentor");


@Component({})
export default class extends Vue {
  @mentorStore.Action fetchMentor;
  @mentorStore.Action updateMentor;
  @mentorStore.Action deleteMentor;
  @mentorStore.Getter isLoading;
  @mentorStore.Getter isUpdating;
  @mentorStore.Getter isDeleting;
  @mentorStore.Getter mentor;

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
        const mentor: Mentor = {
          ...this.mentor,
          ...values,
          photo_url: this.photoURL || this.mentor.photo_url
        };
        console.log("Received values of form: ", values);
        await this.updateMentor({ id: this.$route.params.id, mentor });
        this.navigateToMentor(this.$route.params.id);
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
    var mentorAvatar = storageRef.child(
      `mentor_avatars/${file.name}_${timestamp}`
    );
    const uploadTask: firebase.storage.UploadTask = mentorAvatar.put(file);
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
    this.fetchMentor(this.$route.params.id);
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
      onOk: this.onDeleteMentor,
      onCancel: () => {}
    });
  }
  async onDeleteMentor() {
    const isSuccess: boolean = await this.deleteMentor(this.$route.params.id);
    if (isSuccess) this.navigateToMentors();
  }
  navigateToMentor(id: string) {
    this.$router.push({
      name: "mentors-id",
      params: { id }
    });
  }
  navigateToMentors() {
    this.$router.push({
      name: "mentors"
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