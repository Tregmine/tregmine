<template>
    <div class="app">
        <navbar></navbar>
        <router-view v-if="!isErrored"></router-view>
    </div>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator";
import Navbar from "./components/Navbar/Navbar.vue";

@Component({
    components: {Navbar}
})
export default class App extends Vue {
    
}
</script>
