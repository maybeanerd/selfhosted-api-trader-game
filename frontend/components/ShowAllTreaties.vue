<template>
  <div>
    <template v-if="treaties">
      <div v-if="treaties.length === 0">
        No treaties found.
      </div>
      <div v-for="treaty in treaties" v-else :key="treaty.instanceId">
        <p>Status: {{ treaty.status }}</p>
        <p>URL: {{ treaty.url }}</p>
        <p>Instance ID: {{ treaty.instanceId }}</p>
        <br>
      </div>
    </template>
    <div v-else>
      Loading treaties...
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: treaties } = await useFetch<Array<{
  status: string;
  url: string;
  instanceId: string;
}>>(
  'http://localhost:8080/v1/treaty',
);
</script>
