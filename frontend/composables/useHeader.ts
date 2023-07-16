import { ref } from 'vue';

const title = ref<string | null>(null);

export function useHeader () {
  return {
    title,
  };
}
