<template>
  <div>
    <UInput v-model="instanceUrl" class="p-2" />
    <UButton class="p-2" @click="submitTreaty">
      Submit Treaty
    </UButton>
  </div>
</template>

<script setup lang="ts">
const instanceUrl = ref('');

async function submitTreaty() {
  const treaty = {
    url: instanceUrl.value,
  };

  await fetch('http://localhost:8080/v1/treaty', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(treaty),
  });

  instanceUrl.value = '';
}

</script>
