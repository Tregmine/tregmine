import './stores';

import Vue from "vue";
import VueRouter, { Route, Location } from 'vue-router';
import { UserStore } from './stores/UserStore';
import { Dispatcher } from './util/Dispatcher';
import App from "./App.vue";
import * as Constants from '../Constants';
import * as SDK from "./sdk";

const router = new VueRouter({
    routes: [
    ],
    mode: "history",
    scrollBehavior (to, from, savedPosition) {
        if (to.hash) return { selector: to.hash };
        return savedPosition || { x: 0, y: 0 };
    }
});

var redirectToLoginLocation = (from: Route): Location => {
    return { path: "/", query: { redirectURL: from.fullPath }};
}

router.beforeEach((to, from, next) => {
    document.title = to.meta.title ? `${to.meta.title} · Tregmine` : "Tregmine";
    next();
});

router.beforeEach((to, from, next) => {
    if (!to.matched.some((route) => route.meta.requiresAuthenticated)) return next();
    var redirectToLogin = () => next(redirectToLoginLocation(to));
    UserStore.getUser().then((user) => {
        if (!user) return redirectToLogin();
        next();
    }).catch(() => redirectToLogin());
})

Dispatcher.register(async (event) => {
    const route = router.currentRoute;
    switch (event.event) {
        case "USER_UPDATE":
        if (route.meta.requiresAuthenticated) {
            var user = await UserStore.getUser();
            if (!user) router.push(redirectToLoginLocation(route));
        }
        break;
        case "REDIRECT_TO_LOGIN":
        router.push(redirectToLoginLocation(router.currentRoute));
        break;
    }
}, "route_user");

const vue = new Vue({
    el: "#app",
    render: h => h(App),
    router
});

document.addEventListener("touchstart", () => {}, true);

if (Constants.DEBUG) {
    Constants.DEBUG_TREE.Vue = {
        router,
        vue,
        Vue,
        components: {
            App
        }
    };
    Constants.DEBUG_TREE.dump = () => {
        const getCircularReplacer = () => {
            const seen = new WeakSet;
            return (key, value) => {
              if (typeof value === "object" && value !== null) {
                if (seen.has(value)) {
                  return;
                }
                seen.add(value);
              }
              return value;
            };
        };
        const debugTreeSample = Object.assign({}, Constants.DEBUG_TREE);
        delete debugTreeSample.Vue;
        if (debugTreeSample.Constants && debugTreeSample.Constants.DEBUG_TREE) {
            debugTreeSample.Constants = Object.assign({}, debugTreeSample.Constants);
            delete debugTreeSample.Constants.DEBUG_TREE;
        }
        return JSON.stringify(debugTreeSample, getCircularReplacer());
    }
    Constants.DEBUG_TREE.Constants = Constants;
    Constants.DEBUG_TREE.SDK = SDK;
    Constants.DEBUG_TREE.Log = [];
}