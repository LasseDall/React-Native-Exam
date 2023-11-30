import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, Button, Keyboard, FlatList, View, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { db, storage } from './components/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, doc, setDoc, addDoc, getDocs, deleteDoc, updateDoc, getDoc } from 'firebase/firestore'
import * as ImagePicker from 'expo-image-picker';


import axios from 'axios';

const API_KEY = "AIzaSyDMRNaAdpZ4qpu_wKgG2UBBGDb5Qj8wScg";
const AUTH_URL = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=";
const SIGNUP_URL = "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key="

const Stack = createNativeStackNavigator();

async function updateVinylFire(id, title, email, imagePath, imageChanged) {
  if(title != "") {
    await updateDoc(doc(db, "users", email, "collection", id), {
      title: title
    });
  }
  if (imageChanged) {
    const uploadImage = await fetch(imagePath);
    const blob = await uploadImage.blob();
    const storageRef = await ref(storage, email + id + ".jpg");
    uploadBytes(storageRef, blob)
    .then( (snapshot) => {
      console.log("Image uploaded!");
      return true;
    })
    .catch((error) => console.log("Image failed to upload: " + error));
  }
}

const App = () => {

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='Login'>
        <Stack.Screen
          name='Login'
          component={Login}
          options={{ title: 'Login' }}
        />
        <Stack.Screen
          name='Signup'
          component={Signup}
          options={{ title: 'Signup' }}
        />
        <Stack.Screen
          name='Home'
          component={Home}
          options={{ title: 'Home' }}
        />
        <Stack.Screen
          name='VinylPage'
          component={VinylPage}
          options={{ title: 'Vinyl' }}
        />
        <Stack.Screen
          name='CreateVinylPage'
          component={CreateVinylPage}
          options={{ title: 'New vinyl' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const Login = ({ navigation, route }) => {

  async function login(email, password) {
    try {
      const response = await axios.post(AUTH_URL + API_KEY, {
        email: email,
        password: password,
        returnSecureToken: true,
      });
      navigation.navigate("Home", { email: email });
    } catch (error) {
      alert("Wrong password or username");
    }
  }

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Login</Text>
      <TextInput
        style={styles.textInput}
        onChangeText={(txt) => setUsername(txt)}
        placeholder='Username'
      />
      <TextInput
        style={styles.textInput}
        onChangeText={(txt) => setPassword(txt)}
        placeholder='Password'
        secureTextEntry={true}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={() => { login(username, password) }}
      >
        <Text style={styles.buttonText}>LOGIN</Text>
      </TouchableOpacity>
      <TouchableOpacity 
    style={ styles.button } 
    title='createAccount' 
    onPress={ () => {
          navigation.navigate("Signup")
      }}>
        <Text style={styles.buttonText}>CREATE NEW ACCOUNT</Text>
    </TouchableOpacity>
    </View>
  );
};

const Signup = ({ navigation, route }) => {
  
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  let [showErrorBox, setShowErrorBox] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function signup(email, password) {
    try {
      const response = await axios.post(SIGNUP_URL + API_KEY, {
        email: email,
        password: password,
        returnSecureToken: true
      });
      await setDoc(doc(db, "users", email), {});
      await collection(db, "users", email, "collection");
      navigation.navigate("Home", { email: email });
    } catch(error) {
      showErrorBoxFunction(error.response.data.error.message);
    }
  }

  const showErrorBoxFunction = (errorMessage) => {
    setShowErrorBox(true);
    setErrorMessage(errorMessage);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>New user</Text>
      <TextInput
        style={ styles.textInput }
        onChangeText={(txt) => setNewUsername(txt)}
        placeholder='Username'
        value={newUsername}
      />
      <TextInput
        style={ styles.textInput }
        onChangeText={(txt) => setNewPassword(txt)}
        placeholder='Password'
        value={newPassword}
        secureTextEntry={true}
      />
      <TouchableOpacity
        style={ styles.button}
        title='createAccount'
        onPress={() => {signup(newUsername, newPassword)}}
      >
        <Text style={styles.buttonText}>CREATE ACCOUNT</Text>
      </TouchableOpacity>
      {showErrorBox && (
        <View style={{ padding: 10 }}>
          <Text id='errorMessage' style={{ color: 'red' }}>{errorMessage}</Text>
        </View>
      )}

    </View>
)};

const Home = ({ navigation, route }) => {
  const email = route.params?.email;
  const [values, loading, error] = useCollection(collection(db, "users", email, "collection"));
  const [data, setData] = useState([]);
  const [imagePaths, setImagePaths] = useState([]);

  useEffect(() => {

    console.log(route.params, route.params.imageChanged)
    const fetchData = async () => {
      if (values) {
        const newData = values.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
        setData(newData);
        downloadImages(newData);
      }
  
      if (route.params && route.params.imageChanged) {
        console.log("JUBII");
        const updatedId = route.params.id;
        const updatedImagePath = await downloadImage(updatedId);
        console.log(updatedImagePath);
  
        setImagePaths((prevPaths) => ({
          ...prevPaths,
          [updatedId]: updatedImagePath,
        }));
      }
    };
  
    fetchData();
  }, [values, route.params]);

  const downloadImage = async (id) => {
    try {
      const url = await getDownloadURL(ref(storage, email + id + ".jpg"));
      return url;
    } catch (error) {
      console.error("Error downloading image:", error);
      return null;
    }
  };

  const downloadImages = async (data) => {
    const paths = {};
    await Promise.all(
      data.map(async (item) => {
        try {
          const imagePath = await downloadImage(item.id);
          paths[item.id] = imagePath;
        } catch (error) {
          console.error("Error downloading image:", error);
          paths[item.id] = null; // Handle the error gracefully
        }
      })
    );
    setImagePaths(paths);
  };

  const deleteDocument = async (id) => {
    await deleteDoc(doc(db, "users", email, "collection", id));
  };

  const updateVinyl = (id, newVinyl) => {
    setNotes((prevVinyl) => ({
      ...prevVinyl,
      [id]: newVinyl,
    }));
  };


  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => {
        navigation.navigate("VinylPage", { id: item.id, title: item.title, email: email, updateVinyl: updateVinyl });
      }}
    >
      <View>
        {imagePaths[item.id] !== null ? (
          <Image style={{ width: 200, height: 200 }} source={{ uri: imagePaths[item.id] }} />
        ) : (
          <Text>Add image</Text>
        )}
        <Text style={styles.itemText}>{item.title}</Text>
        <Text style={styles.itemText}>{item.artist}</Text>
        <Text style={styles.itemText}>{item.country} {item.year}</Text>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={() => deleteDocument(item.id)}>
        <View style={styles.deleteView}>
          <Text style={styles.deleteButtonText}>x</Text>
        </View>
      </TouchableOpacity>
    </TouchableOpacity>
  );
  

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Collection</Text>
      <FlatList data={data} renderItem={renderItem} keyExtractor={(item) => item.id} />
      <Button
        title='New vinyl'
        onPress={() => {
          navigation.navigate("CreateVinylPage", { email: email });
        }}
      />
    </View>
  );
};



const VinylPage = ({ navigation, route }) => {
  const title = route.params?.title;
  const id = route.params?.id;
  const email = route.params?.email;
  const updateNote = route.params?.updateNote;
  const [newTitle, setNewTitle] = useState('');
  const [imagePath, setImagePath] = useState(null);
  const [imageChanged, setImageChanged] = useState(false);


  useEffect(() => {
    downloadImage();
  }, [])

  async function downloadImage() {
    await getDownloadURL(ref(storage, email + id + ".jpg"))
    .then( (url) => {
      setImagePath(url);
    });
  }

  async function launchImagePicker() {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true
    });
    if(!result.canceled) {
      setImageChanged(true);
      return result.assets[0].uri;
    }
  }
  
  async function launchCamera() {
    const result = await ImagePicker.requestCameraPermissionsAsync();
    if(!result) {
      alert("Camera access not provided");
    } else {
      ImagePicker.launchCameraAsync({
        quality: 1
      })
      .then((response) => {
        if(!response.canceled) {
          setImageChanged(true);
          return response.assets[0].uri;
        }
      })
      .catch((error) => {
        alert("Camera failed: " + error);
      });
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{title}</Text>
      <Image style={{ width:200, height:200 }} source={{ uri:imagePath }}/>
      <TextInput
        style={ styles.textInput }
        onChangeText={(txt) => setNewTitle(txt)}
        placeholder='Edit title'
        value={newTitle}
      />
      <TouchableOpacity style={ styles.button } title='pickImage'  onPress={async () => {
          try {
            const img = await launchImagePicker();
            setImagePath(img);
          } catch (error) {
            console.error("Error using camera:", error);
          }
        }}>
        <Text>ADD IMAGE</Text>
      </TouchableOpacity>
      <TouchableOpacity style={ styles.button } title='useCamera' onPress={ async () => {
         const img = await launchCamera();
         setImagePath(img); 
      }}>
        <Text>TAKE PICTURE</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={ styles.button }
        title='Save changes'
        onPress={ async () => {
          console.log(imageChanged)
            await updateVinylFire(id, newTitle, email, imagePath, imageChanged);
            if (imageChanged === false ) {
              console.log("WHY", imageChanged)
              navigation.goBack();
            } else {
              setTimeout(() => {
                navigation.navigate("Home", { imageChanged: true, id: id, email: email });
                setImageChanged(false);
              }, 500); 
            }
        }}
      >
        <Text>SAVE CHANGES</Text>
      </TouchableOpacity>
    </View>
  );
};

const CreateVinylPage = ({ navigation, route }) => {

  const email = route.params?.email;
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newYear, setNewYear] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>New vinyl</Text>
      <TextInput
        style={ styles.textInput }
        onChangeText={(txt) => setNewTitle(txt)}
        placeholder='Title'
        value={newTitle}
      />
      <TextInput
        style={ styles.textInput }
        onChangeText={(txt) => setNewArtist(txt)}
        placeholder='Artist'
        value={newArtist}
      />
      <TextInput
        style={ styles.textInput }
        onChangeText={(txt) => setNewCountry(txt)}
        placeholder='Country'
        value={newCountry}
      />
      <TextInput
        style={ styles.textInput }
        onChangeText={(txt) => setNewYear(txt)}
        placeholder='Year'
        value={newYear}
      />
      <TouchableOpacity
        style={ styles.button }
        title='Add new vinyl'
        onPress={ async () => {
            try {
              await addDoc(collection(db, "users", email, "collection"), { title: newTitle, artist: newArtist, country: newCountry, year: newYear });
              navigation.goBack();
            } catch(err) {
              console.log(err);
            }
          Keyboard.dismiss();
        }}
      >
      <Text>SAVE CHANGES</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  heading: {
    fontSize: 24,
    marginBottom: 16,
  },
  textInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 16,
    width: '100%',
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: 'lightblue',
    padding: 10,
    width: '100%',
    alignItems: 'center',
    margin: 2,
    borderRadius: 5
  },
  buttonText: {
    color: '#fff',
  },
  item: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'black',
    width: '100%'
  },
  itemText: {
    fontSize: 16,
    width: '96%',
    textAlign: 'center'
  },
  deleteButton: {
    backgroundColor: 'clear',
    borderRadius: 5,
    justifyContent: 'flex-end',
    paddingRight: '5%',
    marginTop: 'auto'
  },
  deleteButtonText: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteView: {
    flex: 1,
    alignItems: 'flex-end',
  },
});

export default App;

