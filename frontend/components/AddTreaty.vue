<template>
  <div>
    <NButton @click="addTreaty">
      Add Treaty
    </NButton>
  </div>
</template>

<script setup lang="ts">
import { NButton } from 'naive-ui';

async function addTreaty () {
  /* const { error, loading } = */
  await useFetch<Array<{
    status: string;
    url: string;
    instanceId: string;
  }>>(
    'http://localhost:8080/v1/treaty', {
      method: 'POST',
      body: {
        url: 'https://example-server.com',
      },
    },
  );
}

</script>
