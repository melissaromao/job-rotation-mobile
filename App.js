import React from "react";
import { ActivityIndicator, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "./src/AuthContext";
import { colors } from "./src/theme";
import HomeScreen from "./src/screens/HomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import MainScreen from "./src/screens/MainScreen";
import OrganizacaoScreen from "./src/screens/OrganizacaoScreen";

const Stack = createNativeStackNavigator();

function Routes() {
  const { token, ready } = useAuth();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white }}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.white } }}>
        {token ? (
          <>
            <Stack.Screen name="Main" component={MainScreen} />
            <Stack.Screen name="Organizacao" component={OrganizacaoScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Routes />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
