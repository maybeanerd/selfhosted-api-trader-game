<template>
  <div>
    <template v-if="treaties">
      <div v-if="treaties.length === 0">
        No treaties found.
      </div>
      <div v-for="treaty in treaties" v-else :key="treaty.activityPubActorId" class="border-2 p-2">
        <p>Actor: {{ treaty.activityPubActorId }}</p>
        <p>Status: {{ treaty.status }}</p>
        <br>
        <UButton v-if="treaty.status === 'proposed'" @click="acceptTreaty(treaty.activityPubActorId)">
          Accept
        </Ubutton>
        <UButton v-else-if="treaty.status === 'signed'" @click="deleteTreaty(treaty.activityPubActorId)">
          Delete
        </Ubutton>
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
  activityPubActorId: string;
}>>(
  'http://localhost:8080/v1/treaty',
);

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

async function deleteTreaty (
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
