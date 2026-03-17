import { startTransition, useCallback, useDeferredValue, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  deleteLabourById,
  Labour,
  readLabours,
  saveLabours,
} from "../../src/utils/labour";

type DeviceContact = {
  id: string;
  name?: string;
  phoneNumbers?: { number?: string | null }[] | null;
};

export default function LaboursScreen() {
  const router = useRouter();

  const [labours, setLabours] = useState<Labour[]>([]);
  const [contacts, setContacts] = useState<DeviceContact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<DeviceContact[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [contactsLoaded, setContactsLoaded] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  const deferredSearch = useDeferredValue(search);

  useFocusEffect(
    useCallback(() => {
      loadLabours();
    }, []),
  );

  useEffect(() => {
    const query = deferredSearch.trim().toLowerCase();

    startTransition(() => {
      if (!query) {
        setFilteredContacts(contacts);
        return;
      }

      setFilteredContacts(
        contacts.filter((contact) => {
          const name = contact.name?.toLowerCase() ?? "";
          const phone = normalizePhone(contact.phoneNumbers?.[0]?.number ?? "");

          return name.includes(query) || phone.includes(query.replace(/\D/g, ""));
        }),
      );
    });
  }, [contacts, deferredSearch]);

  const loadLabours = async () => {
    const storedLabours = await readLabours();
    setLabours(storedLabours);
  };

  const persistLabours = async (nextLabours: Labour[]) => {
    await saveLabours(nextLabours);
    setLabours(nextLabours);
  };

  const ensureContactsLoaded = async (): Promise<DeviceContact[] | null> => {
    if (contactsLoaded) {
      return contacts;
    }

    if (isLoadingContacts) {
      return null;
    }

    setIsLoadingContacts(true);

    try {
      const { status } = await Contacts.requestPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission needed", "Allow contacts access to add labours from your phone.");
        return null;
      }

      const result = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
        pageSize: 2000,
      });

      const cleanedContacts = result.data.filter(
        (contact) => contact.name && contact.phoneNumbers && contact.phoneNumbers.length > 0,
      );

      setContacts(cleanedContacts);
      setFilteredContacts(cleanedContacts);
      setContactsLoaded(true);

      return cleanedContacts;
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const openContacts = async () => {
    const loadedContacts = await ensureContactsLoaded();

    if (!loadedContacts) {
      return;
    }

    setSearch("");
    setFilteredContacts(loadedContacts);
    setModalVisible(true);
  };

  const addLabour = async (contact: DeviceContact) => {
    const phone = contact.phoneNumbers?.[0]?.number ?? "";
    const cleanPhone = normalizePhone(phone);

    const exists = labours.find((labour) => normalizePhone(labour.phone) === cleanPhone);

    if (exists) {
      Alert.alert("Already added", "This labour is already in your list.");
      return;
    }

    const newLabour: Labour = {
      id: Date.now().toString(),
      name: contact.name ?? "Unnamed Contact",
      phone,
    };

    const nextLabours = [...labours, newLabour];
    await persistLabours(nextLabours);
    setModalVisible(false);
  };

  const deleteLabour = (id: string) => {
    Alert.alert("Delete labour", "Are you sure you want to remove this worker?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const nextLabours = await deleteLabourById(id);
          setLabours(nextLabours);
        },
      },
    ]);
  };

  const renderLabour = ({ item }: { item: Labour }) => (
    <TouchableOpacity
      onPress={() => router.push(`/labour/${item.id}`)}
      style={styles.card}
    >
      <View style={styles.workerDetails}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.phone}>{item.phone}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => deleteLabour(item.id)}>
          <MaterialCommunityIcons name="delete" size={24} color="#ef4444" />
        </TouchableOpacity>

        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color="#94a3b8"
        />
      </View>
    </TouchableOpacity>
  );

  const renderContact = ({ item }: { item: DeviceContact }) => (
    <TouchableOpacity
      onPress={() => addLabour(item)}
      style={styles.contactCard}
    >
      <Text style={styles.contactName}>{item.name}</Text>
      <Text style={styles.contactPhone}>{item.phoneNumbers?.[0]?.number ?? ""}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Labours</Text>

        <FlatList
          data={labours}
          keyExtractor={(item) => item.id}
          renderItem={renderLabour}
          contentContainerStyle={labours.length === 0 ? styles.emptyList : styles.listContent}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={8}
          removeClippedSubviews
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No labours added</Text>
              <Text style={styles.emptyText}>
                Tap the add button to import a worker from your phone contacts.
              </Text>
            </View>
          }
        />

        <TouchableOpacity
          onPress={openContacts}
          style={styles.addButton}
        >
          {isLoadingContacts ? (
            <ActivityIndicator color="white" />
          ) : (
            <MaterialCommunityIcons name="account-plus" size={28} color="white" />
          )}
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <Text style={styles.modalTitle}>Select Contact</Text>

          <TextInput
            onChangeText={setSearch}
            placeholder="Search contact or phone..."
            placeholderTextColor="#94a3b8"
            style={styles.search}
            value={search}
          />

          <FlatList
            data={filteredContacts}
            keyExtractor={(item) => item.id}
            renderItem={renderContact}
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            windowSize={10}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={filteredContacts.length === 0 ? styles.emptyContactsList : styles.contactsList}
            ListEmptyComponent={
              <View style={styles.emptyContactsState}>
                <Text style={styles.emptyContactsTitle}>No matching contacts</Text>
                <Text style={styles.emptyContactsText}>
                  Try a different name or phone number.
                </Text>
              </View>
            }
          />

          <TouchableOpacity
            onPress={() => setModalVisible(false)}
            style={styles.closeBtn}
          >
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "").slice(-10);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
  },
  listContent: {
    paddingBottom: 120,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyState: {
    backgroundColor: "#111c34",
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1e3a8a",
  },
  emptyTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
  },
  emptyText: {
    color: "#94a3b8",
    marginTop: 8,
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#1e293b",
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  workerDetails: {
    flex: 1,
    paddingRight: 16,
  },
  name: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  phone: {
    color: "#94a3b8",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 15,
    alignItems: "center",
  },
  addButton: {
    position: "absolute",
    right: 25,
    bottom: 40,
    backgroundColor: "#f59e0b",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  modalTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    margin: 20,
  },
  search: {
    backgroundColor: "#1e293b",
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 12,
    borderRadius: 10,
    color: "white",
  },
  contactsList: {
    paddingBottom: 16,
  },
  emptyContactsList: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  emptyContactsState: {
    backgroundColor: "#111c34",
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1e3a8a",
  },
  emptyContactsTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  emptyContactsText: {
    color: "#94a3b8",
    marginTop: 6,
    lineHeight: 20,
  },
  contactCard: {
    backgroundColor: "#1e293b",
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
  },
  contactName: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  contactPhone: {
    color: "#94a3b8",
    marginTop: 4,
    fontSize: 12,
  },
  closeBtn: {
    backgroundColor: "#ef4444",
    padding: 15,
    alignItems: "center",
    margin: 20,
    borderRadius: 10,
  },
  closeText: {
    color: "white",
    fontWeight: "700",
  },
});
