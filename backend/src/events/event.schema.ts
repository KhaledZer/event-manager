export interface Event {
    id: string;
    title: string; 
    startTime: string; 
    endTime: string; 
    userId: string; 
}

export interface Attendee {
    id: string;
    eventId: string; 
    userId: string; 
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED'; 
}
 

