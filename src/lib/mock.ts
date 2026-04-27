export type Service = { id: string; name: string; duration: number; price: number };
export type Barber = { id: string; name: string; photo: string; active: boolean };
export type Appointment = {
  id: string;
  client: string;
  service: string;
  barber: string;
  time: string;
  date: string;
  status: "agendado" | "chegou" | "finalizado" | "faltou" | "cancelado";
  price: number;
};

export const services: Service[] = [
  { id: "s1", name: "Corte Masculino", duration: 30, price: 50 },
  { id: "s2", name: "Barba Completa", duration: 25, price: 35 },
  { id: "s3", name: "Corte + Barba", duration: 50, price: 75 },
  { id: "s4", name: "Pezinho", duration: 15, price: 20 },
  { id: "s5", name: "Sobrancelha", duration: 10, price: 15 },
];

export const barbers: Barber[] = [
  { id: "b1", name: "Rafael Silva", photo: "https://i.pravatar.cc/200?img=12", active: true },
  { id: "b2", name: "Marcos Lima", photo: "https://i.pravatar.cc/200?img=33", active: true },
  { id: "b3", name: "João Pedro", photo: "https://i.pravatar.cc/200?img=15", active: true },
  { id: "b4", name: "Diego Souza", photo: "https://i.pravatar.cc/200?img=68", active: false },
];

export const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
];

export const myAppointments: Appointment[] = [
  { id: "a1", client: "Você", service: "Corte + Barba", barber: "Rafael Silva", time: "14:30", date: "Sex, 25 Abr", status: "agendado", price: 75 },
  { id: "a2", client: "Você", service: "Corte Masculino", barber: "Marcos Lima", time: "10:00", date: "Sáb, 03 Mai", status: "agendado", price: 50 },
  { id: "a3", client: "Você", service: "Barba Completa", barber: "João Pedro", time: "16:00", date: "Ter, 15 Abr", status: "finalizado", price: 35 },
];

export const todayAppointments: Appointment[] = [
  { id: "t1", client: "Carlos Mendes",  service: "Corte Masculino", barber: "Rafael Silva", time: "09:00", date: "Hoje", status: "finalizado", price: 50 },
  { id: "t2", client: "Pedro Henrique", service: "Corte + Barba",   barber: "Marcos Lima",  time: "10:00", date: "Hoje", status: "chegou",     price: 75 },
  { id: "t3", client: "Lucas Almeida",  service: "Barba Completa",  barber: "Rafael Silva", time: "11:30", date: "Hoje", status: "agendado",   price: 35 },
  { id: "t4", client: "André Costa",    service: "Corte + Barba",   barber: "João Pedro",   time: "14:00", date: "Hoje", status: "agendado",   price: 75 },
  { id: "t5", client: "Bruno Ferreira", service: "Pezinho",         barber: "Marcos Lima",  time: "15:30", date: "Hoje", status: "agendado",   price: 20 },
  { id: "t6", client: "Felipe Rocha",   service: "Corte Masculino", barber: "Rafael Silva", time: "17:00", date: "Hoje", status: "agendado",   price: 50 },
];
