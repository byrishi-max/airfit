import { createClient as createLocalClient, findClientByPhone, getClients, registerClientRemote, saveClient, saveClients } from './storage';
import { isFirebaseConfigured, db, toIsoNow } from './firebaseClient';
import { collection, doc, setDoc, getDocs, query, where, updateDoc, deleteDoc, limit as limitDocs, orderBy } from 'firebase/firestore';
import { getPlansForClient } from './planRepository';

const mapClientFromFirebase = (data, plans = []) => {
  const workoutPlan = plans.find(plan => plan.plan_type === 'workout');
  const dietPlan = plans.find(plan => plan.plan_type === 'diet');
  const readyPlan = workoutPlan?.status === 'ready' ? workoutPlan : dietPlan?.status === 'ready' ? dietPlan : null;
  const pendingPlan = plans.find(plan => plan.status === 'pending' || plan.status === 'processing');

  return {
    clientId: data.client_id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    planStatus: readyPlan ? 'ready' : pendingPlan ? 'pending' : data.plan_status || 'none',
    workoutPlan: workoutPlan?.workout_json || null,
    dietPlan: dietPlan?.diet_html || null,
    workoutStatus: workoutPlan?.status || 'none',
    dietStatus: dietPlan?.status || 'none',
    generatedAt: readyPlan?.generated_at || '',
    registeredAt: data.created_at,
  };
};

export async function listClients() {
  if (!isFirebaseConfigured) {
    return getClients();
  }

  const clientsRef = collection(db, 'clients');
  const q = query(clientsRef, orderBy('created_at', 'desc'));
  const snapshot = await getDocs(q);
  
  const clients = await Promise.all(snapshot.docs.map(async (docSnap) => {
    const data = docSnap.data();
    const plans = await getPlansForClient(data.client_id).catch(() => []);
    return mapClientFromFirebase(data, plans);
  }));
  
  saveClients(clients);
  return clients;
}

export async function findClientByPhoneRemote(phone) {
  if (!isFirebaseConfigured) {
    return findClientByPhone(phone);
  }

  const clientsRef = collection(db, 'clients');
  const q = query(clientsRef, where('phone', '==', phone), limitDocs(1));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  const data = snapshot.docs[0].data();
  const plans = await getPlansForClient(data.client_id).catch(() => []);
  const client = mapClientFromFirebase(data, plans);
  saveClient(client);
  return client;
}

export async function createClientRecord({ name, email, phone }) {
  const clientId = `af_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

  if (!isFirebaseConfigured) {
    const localClients = getClients();
    if (localClients.some(client => client.email?.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email already exists');
    }
    if (localClients.some(client => client.phone === phone)) {
      throw new Error('Phone number already exists');
    }
    const localClient = createLocalClient(name, email, phone);
    await registerClientRemote(localClient).catch(() => null);
    return localClient;
  }

  const clientsRef = collection(db, 'clients');
  
  const emailQ = query(clientsRef, where('email', '==', email), limitDocs(1));
  const emailSnap = await getDocs(emailQ);
  if (!emailSnap.empty) throw new Error('Email already exists');

  const phoneQ = query(clientsRef, where('phone', '==', phone), limitDocs(1));
  const phoneSnap = await getDocs(phoneQ);
  if (!phoneSnap.empty) throw new Error('Phone number already exists');

  const newClientData = {
    client_id: clientId,
    name,
    email,
    phone,
    plan_status: 'none',
    created_at: toIsoNow()
  };

  await setDoc(doc(db, 'clients', clientId), newClientData);
  
  const client = mapClientFromFirebase(newClientData, []);
  saveClient(client);
  await registerClientRemote(client).catch(() => null);
  return client;
}

export async function updateClientPlanStatus(clientId, planStatus) {
  if (!isFirebaseConfigured || !clientId) return null;

  const clientRef = doc(db, 'clients', clientId);
  return updateDoc(clientRef, {
    plan_status: planStatus,
    updated_at: toIsoNow()
  });
}

export async function deleteClientRecord(clientId) {
  if (!isFirebaseConfigured || !clientId) return null;
  const clientRef = doc(db, 'clients', clientId);
  return deleteDoc(clientRef);
}
