import { io } from 'socket.io-client';
import axios from 'axios';

const URL = 'http://localhost:5001';

async function runTest() {
  console.log('🧪 Starting Multi-Client Socket.IO Permission Verification Test...\n');

  // 1. Create room via REST API
  const createRes = await axios.post(`${URL}/api/rooms`, {
    roomName: 'Socket Integration Test Party',
    username: 'AnkushHost'
  });

  const { roomCode, userId: hostUserId, roomId } = createRes.data.data;
  console.log(`✅ Room Created via REST: Code [${roomCode}], Host UserId [${hostUserId}]`);

  const clientHost = io(URL, { transports: ['websocket'] });
  const clientParticipant = io(URL, { transports: ['websocket'] });

  let participantUserId = null;

  clientHost.on('connect', () => {
    console.log('⚡ Client 1 (Host) connected via WebSocket');
    clientHost.emit('join_room', { roomCode, username: 'AnkushHost', userId: hostUserId }, (resHost) => {
      console.log(`👑 Host Joined Room: Role = [${resHost.data.user.role}]`);

      // 2. Connect Participant
      clientParticipant.emit('join_room', { roomCode, username: 'AmanParticipant' }, (resPart) => {
        participantUserId = resPart.data.user.userId;
        console.log(`👤 Participant Joined Room: Role = [${resPart.data.user.role}], UserId = [${participantUserId}]`);

        // Test 1: Host emits Play
        console.log('\n--- TEST 1: Host emits play ---');
        clientHost.emit('play', { currentTime: 15 });
      });
    });
  });

  // Participant listens for play event
  clientParticipant.on('play', (data) => {
    console.log('✅ Participant received PLAY event broadcast:', data);

    console.log('\n--- TEST 2: Participant attempts unauthorized PLAY ---');
    clientParticipant.emit('play', { currentTime: 25 });
  });

  // Action error handling
  clientParticipant.on('action_error', (data) => {
    console.log('🛡️ BACKEND PERMISSION ENFORCEMENT SUCCESS: Server rejected unauthorized action:', data);

    if (data.action === 'play') {
      console.log('\n--- TEST 3: Host promotes Participant to MODERATOR ---');
      clientHost.emit('assign_role', { targetUserId: participantUserId, role: 'MODERATOR' });
    } else if (data.action === 'remove_participant') {
      console.log('🛡️ BACKEND PERMISSION ENFORCEMENT SUCCESS: Moderator removal attempt blocked!');

      console.log('\n--- TEST 6: Host removes Moderator ---');
      clientHost.emit('remove_participant', { targetUserId: participantUserId });
    }
  });

  clientParticipant.on('role_assigned', (data) => {
    console.log('✅ Role update broadcast received:', data.message);

    console.log('\n--- TEST 4: Now Moderator emits PAUSE ---');
    clientParticipant.emit('pause', { currentTime: 40 });
  });

  clientHost.on('pause', (data) => {
    console.log('✅ Host received PAUSE event from Moderator:', data);

    console.log('\n--- TEST 5: Moderator attempts Host-only action (remove_participant) ---');
    clientParticipant.emit('remove_participant', { targetUserId: hostUserId });
  });

  clientHost.on('participant_removed', (data) => {
    console.log('✅ Host received participant_removed event:', data.message);
    console.log('\n🎉 ALL SOCKET PERMISSION & REAL-TIME SYNC TESTS PASSED PERFECTLY!\n');
    process.exit(0);
  });
}

runTest().catch(console.error);
