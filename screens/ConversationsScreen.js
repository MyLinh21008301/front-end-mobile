import { View, TextInput, FlatList, StyleSheet } from 'react-native';
import { useState } from 'react';
import ConversationItemComponent from '../components/ConversationItemComponent';
import { useNavigation } from '@react-navigation/native';
import BottomNavBar from '../components/BottomNavBar';
import MainHeader from '../components/MainHeader';
import { useSocket } from '../SocketContext'; // Import the context hook
import Colors from '../constants/colors';
import { initConversation } from '../api/ConversationAPI';
import { getToken } from '../api/TokenAPI';

export default function ConversationsScreen() {
  const [search, setSearch] = useState('');
  const navigation = useNavigation();

  // Get socket data from context
  const { conversations } = useSocket();

  // Log conversations for debugging
  console.log('conversations:', conversations);

  return (
    <View style={styles.container}>
      <MainHeader />
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm..."
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <FlatList
        style={styles.conversationsListContainer}
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationItemComponent
            conversation={item}
            onPress={async (id) => {
              // console.log(id)
              const jwt = await getToken(); // Fetch the token
              initConversation(jwt, id); // Initialize the conversation
              navigation.navigate('ConversationScreen', { conversationId: id })
            }}
          />
        )}
        contentContainerStyle={{ paddingBottom: 70 }}
        showsVerticalScrollIndicator={false}
      />
      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
  },
  conversationsListContainer: {
    paddingHorizontal: 16,
  },
});