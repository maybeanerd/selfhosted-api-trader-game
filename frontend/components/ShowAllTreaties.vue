<template>
  <div>
    <template v-if="treaties">
      <div v-if="treaties.length === 0">
        No treaties found.
      </div>
      <div v-for="treaty in activeTreaties" v-else :key="treaty.activityPubActorId" class="border-2 p-2">
        <p>Actor: {{ treaty.activityPubActorId }}</p>
        <p>Status: {{ treaty.status }}</p>
        <br>
        <UButton v-if="treaty.status === 'proposed'" @click="acceptTreaty(treaty.activityPubActorId)">
          Accept
        </Ubutton>
        <UButton @click="removeTreaty(treaty.activityPubActorId)">
          Remove
        </Ubutton>
      </div>
      <br>

      <template v-if="removedTreaties">
        <h2>Removed Treaties:</h2>
        <div v-for="treaty in removedTreaties" :key="treaty.activityPubActorId" class="border-2 p-2">
          <p>Actor: {{ treaty.activityPubActorId }}</p>
          <p>Status: {{ treaty.status }}</p>
          <UButton @click="acceptTreaty(treaty.activityPubActorId)">
            Revive
          </Ubutton>
        </div>
      </template>
    </template>
    <div v-else>
      Loading treaties...
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: treaties, refresh } = await useFetch<Array<{
  status: string;
  activityPubActorId: string;
}>>(
  'http://localhost:8080/v1/treaty',
);

let stopInterval: NodeJS.Timeout;

onMounted(() => {
  // Refresh data every 2.5 seconds
  stopInterval = setInterval(refresh, 2500);
});

onUnmounted(() => {
  clearInterval(stopInterval);
});

const activeTreaties = computed(() => treaties.value?.filter(treaty => treaty.status !== 'removed'));

const removedTreaties = computed(() => treaties.value?.filter(treaty => treaty.status === 'removed'));

async function acceptTreaty (
  activityPubActorId: string,
) {
  await fetch('http://localhost:8080/v1/treaty', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      activityPubActorId,
      status: 'signed',
    }),
  });
}

async function removeTreaty (
  activityPubActorId: string,
) {
  await fetch('http://localhost:8080/v1/treaty', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      activityPubActorId,
    }),
  });
}
</script>
