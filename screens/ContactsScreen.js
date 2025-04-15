import { View, Text, StyleSheet } from 'react-native';
import BottomNavBar from '../components/BottomNavBar';
import MainHeader from '../components/MainHeader'; 

export default function ContactsScreen() {
  return (
    <View style={styles.container}>
        <MainHeader />
        <Text style={styles.text}>Contacts Screen</Text>
        <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    text: { fontSize: 20, padding: 16 },
});
