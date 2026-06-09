import { useEffect } from "react";
import { View, Text, StyleSheet, Button, Alert } from "react-native";
import { router } from "expo-router";
import { getAuth, logout } from "../../lib/auth";

export default function AdminHome() {
  useEffect(() => {
    (async () => {
      const { role } = await getAuth();
      if (role !== "admin") router.replace("../login");
    })();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Admin Portal</Text>

      <View style={{ marginTop: 20 }}>
        <Button title="Logout" onPress={handleLogout} color="#8B5A2B" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0E0C6",
  },
  text: {
    fontSize: 18,
    fontWeight: "600",
  },
});
