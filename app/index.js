import React, { PropTypes } from 'react'
import { Platform } from 'react-native'
import SplashScreen from 'react-native-splash-screen'
import { StackNavigator, addNavigationHelpers,NavigationActions } from 'react-navigation'
import container from 'redux-container'
import { combineReducers } from 'redux'
import routes from './route'
import * as actions from './module/common/action'
import { fetchAuth } from './module/auth/action'
import { messageCountReducer, userPrefsReducer } from './module/common/reducer'
import { authReducer } from './module/auth/reducer'
import { isEqual } from 'lodash'

import Storage from './lib/storage'
global.storage = new Storage()

const AppNavigator = StackNavigator(routes, {
    initialRouteName: 'home',
    headerMode: "none",
    mode: Platform.OS === 'ios' ? 'modal' : 'card'
})

const resetAction = NavigationActions.reset({
    index: 0,
    actions: [
        NavigationActions.navigate({ routeName: 'home' })
    ]
})

const navReducer = (state, action) => {
    const nextState = AppNavigator.router.getStateForAction(action, state)
    return nextState || state
}

const rootReducer = combineReducers({
    messageCountReducer,
    authReducer,
    userPrefsReducer,
    navReducer
})

@container(rootReducer, {}, { ...actions, fetchAuth }, state => ({
    root: {
        ...state.messageCountReducer,
        ...state.authReducer,
        ...state.userPrefsReducer,
    },
    nav: state.navReducer
}))
class App extends React.Component {
    static childContextTypes = {
        auth: PropTypes.object.isRequired,
        userPrefs: PropTypes.object.isRequired
    }
    getChildContext() {
        const { userPrefs, auth } = this.props.root
        return { auth, userPrefs }
    }
    componentDidMount() {
        const { fetchAuth, fetchUserPrefs, fetchMessageCount } = this.props.actions
        fetchAuth()
        fetchUserPrefs()
        fetchMessageCount()
        SplashScreen.hide()
    }
    componentWillReceiveProps(nextProps) {
        if (nextProps.root.auth.isLogined && !this.props.root.auth.isLogined) {
            this.navigator && this.navigator.dispatch({type:'Navigate',routeName:'home'})
        }
    }
    render() {
        return <AppNavigator ref={nav => { this.navigator = nav; }} navigation={addNavigationHelpers({
            dispatch:this.props.dispatch,
            state:this.props.nav
        })} screenProps={this.props.root}/>
    }
}

export default App