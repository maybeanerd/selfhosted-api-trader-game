<template>
  <Profile :profile="profile" />
</template>

<script setup lang="ts">
import { useHeader } from '~/composables/useHeader';
import { profiles } from '~/server/profiles';

definePageMeta({
  validate: (route) => {
    const { name } = route.params;
    return (
      typeof name === 'string' &&
      profiles.some(
        profile =>
          profile.person.name.first.toLowerCase() === name.toLowerCase(),
      )
    );
  },
});

const route = useRoute();
const name = route.params.name as string;

const profile = profiles.find(
  searchedProfile => searchedProfile.person.name.first.toLowerCase() === name.toLowerCase(),
)!;

const { title } = useHeader();
title.value = `${profile?.person.name.first} ${profile?.person.name.last}`;
</script>
