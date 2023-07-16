import { ref } from 'vue';

const isOpen = ref(false);

export function useMenu () {
  return {
    isOpen,
  };
}
