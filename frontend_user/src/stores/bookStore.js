import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "axios";

export const useBookStore = defineStore("books", () => {
  const books = ref([]);
  const authors = ref([]);
  const publishers = ref([]);
  const isLoading = ref(false);

  const loadBooks = async () => {
    try {
      isLoading.value = true;
      const response = await axios.get(
        "http://localhost:5000/api/books?limit=1000"
      );
      books.value = response.data.data ? response.data.data : response.data;
      console.log("Books loaded:", books.value.length);
    } catch (error) {
      console.error("Error loading books:", error);
    } finally {
      isLoading.value = false;
    }
  };

  const loadAuthors = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/authors");
      authors.value = response.data;
      console.log("Authors loaded:", authors.value.length);
    } catch (error) {
      console.error("Error loading authors:", error);
    }
  };

  const loadPublishers = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/publishers");
      publishers.value = response.data;
      console.log("Publishers loaded:", publishers.value.length);
    } catch (error) {
      console.error("Error loading publishers:", error);
    }
  };

  return {
    books,
    authors,
    publishers,
    isLoading,
    loadBooks,
    loadAuthors,
    loadPublishers,
  };
});
