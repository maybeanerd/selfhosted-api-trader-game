<template>
  <div>
    TODO
    <UButton class="p-2" @click="submitTrade">
      Submit Trade
    </UButton>
  </div>
</template>

<script setup lang="ts">
const instanceUrl = ref('');

async function submitTrade () {
  const trade = {

  };

  await fetch('http://localhost:8080/v1/trade', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(trade),
  });

  instanceUrl.value = '';
}

</script>
