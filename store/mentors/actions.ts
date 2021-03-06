import { plainToClass } from "class-transformer";
import {
  QueryDocumentSnapshot,
  QuerySnapshot,
  CollectionReference
} from "firebase/firebase-firestore";
import { RootState } from "store";
import { ActionContext, ActionTree } from "vuex";
import { Mentor } from "~/modals";
import { fs } from "~/plugins/firebase";
import { MentorState } from "./state";
import { FETCH_END, FETCH_START } from "./types";

export interface Actions<S, R> extends ActionTree<S, R> {
  fetchMentors(
    context: ActionContext<S, R>,
    params: { pagination: any; filters: any; sorter: any }
  ): void;
}

const actions: Actions<MentorState, RootState> = {
  async fetchMentors({ commit, state }, { pagination, filters, sorter }) {
    let colRef: CollectionReference = fs.collection("mentors");
    try {
      commit(FETCH_START);

      if (filters) {
      }
      if (pagination) {
        colRef = colRef.limit(pagination.pageSize);
      }
      if (sorter) {
        switch (sorter.order) {
          case "ascend":
            colRef = colRef.orderBy(sorter.field);
            break;
          case "descend":
            colRef = colRef.orderBy(sorter.field, "desc");
            break;
          default:
        }
      }

      let snap: QuerySnapshot = await colRef.get();
      let mentors: Mentor[] = snap.docs.map((doc: QueryDocumentSnapshot) =>
        plainToClass(Mentor, {
          ...doc.data(),
          id: doc.id
        })
      );
      commit(FETCH_END, mentors);
    } catch (e) {
      console.error(e);
    }
  }
};

export default actions;
