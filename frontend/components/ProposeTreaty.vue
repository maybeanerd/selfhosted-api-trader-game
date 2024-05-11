<template>
  <div>
    <UInput v-model="instanceUrl" class="p-2" />
    <UButton class="p-2" @click="submitTreaty">
      Submit Treaty
    </UButton>
  </div>
</template>

<script setup lang="ts">
import { basePath } from '~/utils/api';

const instanceUrl = ref('');

async function submitTreaty () {
  const treaty = {
    url: instanceUrl.value,
  };

  await fetch(basePath + 'treaties', {
    method: 'POST',
    body: JSON.stringify(treaty),
  });

  instanceUrl.value = '';
}

</script>
