import React from 'react';
import KeyboardSpacer from "react-native-keyboard-spacer";
import { StyleSheet, BackgroundImage, Text, TextInput, Alert, TouchableOpacity, Button, View, Platform, NetInfo, AsyncStorage } from "react-native";
import { GiftedChat, Bubble, InputToolbar } from "react-native-gifted-chat";
import CustomActions from './CustomActions';
import firebase from "firebase";
import "firebase/firestore";
import { MapView } from 'react-native-maps';

export default class Chat extends React.Component {
  constructor() {
    super();


    if (!firebase.apps.length) {
      firebase.initializeApp({
        apiKey: "AIzaSyDpsUGNeTK2kiTFEOxRe71XX9hiYRg0CtE",
        authDomain: "chatapp-4f61a.firebaseapp.com",
        databaseURL: "https://chatapp-4f61a.firebaseio.com",
        projectId: "chatapp-4f61a",
        storageBucket: "chatapp-4f61a.appspot.com",
        messagingSenderId: "485262823540",
        appId: "1:485262823540:web:8ea1f4770a85cc2759c121",
        measurementId: "G-FBXSVB6E2Z"
      })
    }

    this.referenceMessageUser = null;
    this.referenceMessages = firebase.firestore().collection('messages')

    this.state = {
      messages: [],
      uid: 0,
      isConnected: false,
      user: {
        _id: '',
        name: '',
        avatar: ''
      },
    };
  }

  //places the user name in navigation bar
  static navigationOptions = ({ navigation }) => {
    return {
      title: navigation.state.params.name
    };
  };

  get user() {
    return {
      name: this.props.navigation.state.params.name,
      _id: this.state.uid,
      id: this.state.uid,
    }
  }

  onCollectionUpdate = (querySnapshot) => {
    const messages = [];
    // goes through each document
    querySnapshot.forEach(doc => {
      // gets the QueryDocumentSnapshot's data
      var data = doc.data();
      messages.push({
        _id: data._id,
        text: data.text,
        createdAt: data.createdAt.toDate(),
        user: data.user,
        image: data.image || '',
        location: data.location || null
      });
    });
    this.setState({
      messages
    });
  };

  addMessage() {
    console.log(this.state.user)
      this.referenceMessages.add({
        _id: this.state.messages[0]._id,
        text: this.state.messages[0].text || '',
        createdAt: this.state.messages[0].createdAt,
        user: this.state.user,
        uid: this.state.uid,
        image: this.state.messages[0].image || '',
        location: this.state.messages[0].location || null
    });
  }

  onSend(messages = []) {
    this.setState(
      previousState => ({
        messages: GiftedChat.append(previousState.messages, messages)
      }),
      () => {
        this.addMessage();
        this.saveMessages();
      }
    );
  }

// async functions
  getMessages = async () => {
    let messages = '';
    try {
      messages = await AsyncStorage.getItem('messages') || [];
      this.setState({
        messages: JSON.parse(messages)
      });
    } catch (error){
      console.log(error.message);
    }
  };

  saveMessages = async () => {
    try {
      await AsyncStorage.setItem('messages', JSON.stringify(this.state.messages));
    } catch (error) {
      console.log(error.message);
    }
  }

  deleteMessage = async () => {
    try {
      await AsyncStorage.removeItem('messages');
    } catch (error) {
      console.log(error.message);
    }
  }

  componentDidMount() {
    // listen to authentication events
    NetInfo.isConnected.fetch().then(isConnected => {
      if (isConnected == true) {
        console.log('online');
        this.setState({
          isConnected: true,
        })
        this.authUnsubscribe = firebase.auth().onAuthStateChanged(async user => {
          if (!user) {
            await firebase.auth().signInAnonymously();
          }
          //updates user state with current active user data
          this.setState({
            uid: user.uid,
            user: {
              _id: user.uid,
              name: this.props.navigation.state.params.name,
              avatar: '',
            },
            loggedInText: "Hello"
          });

      // create a reference to the active user messages
        this.referenceMessageUser = firebase.firestore().collection("messages");
        // listen for collection changes for current user
        this.unsubscribeMessageUser = this.referenceMessageUser.onSnapshot(this.onCollectionUpdate);
      });
    } else {
      console.log('offline');
      this.setState({
        isConnected: false,
      });
      this.getMessages();
    }
  })
  }

  componentWillUnmount() {
    // stop listening to authentication
    this.authUnsubscribe();
    // stop listening for changes
    this.unsubscribeMessageUser();
  }

  //Gifted Chat functions
  renderBubble(props) {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: '#123458'
          },
          left: {
            backgroundColor: '#6495ED'
          }
        }}
      />
    )
  }
  
    renderInputToolbar(props){
      if (this.state.isConnected == false){
      } else {
        return (
          <InputToolbar
            {...props}
          />
        )
      }
    }
  
    renderCustomActions = (props) => {
     return <CustomActions {...props} />;
   };
  
   renderCustomView (props) {
     const { currentMessage } = props;
     if (currentMessage.location) {
       return (
           <MapView
             style={{width: 150, height: 100, borderRadius: 13, margin: 3}}
             region={{latitude: currentMessage.location.latitude, longitude: currentMessage.location.longitude, latitudeDelta: 0.0922, longitudeDelta: 0.0421}}
           />
       );
     }
     return null;
   }
  
    render() {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: this.props.navigation.state.params.color
          }}
        >
          <GiftedChat
            renderBubble={this.renderBubble.bind(this)}
            renderInputToolbar={this.renderInputToolbar.bind(this)}
            renderActions={this.renderCustomActions.bind(this)}
            renderCustomView={this.renderCustomView}
            messages={this.state.messages}
            onSend={messages => this.onSend(messages)}
            user={this.state.user}
          />
          {Platform.OS === "android" ? <KeyboardSpacer /> : null}
        </View>
      );
    }
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#fff",
      alignItems: "center",
      justifyContent: "center",
      width: "100%"
    }
  });