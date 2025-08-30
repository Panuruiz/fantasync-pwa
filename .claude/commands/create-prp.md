# create-prp

## Descripci�n
Crea un Product Requirements Prompt (PRP) para una nueva funcionalidad o tarea de implementaci�n en Fantasync PWA. Este comando utiliza el agente nextjs-architect para generar un documento estructurado con todos los requisitos t�cnicos y pasos de implementaci�n.

## Uso
```
/create-prp <descripci�n de la funcionalidad>
```

## Argumentos
- `descripci�n`: Texto describiendo la funcionalidad o tarea a implementar (requerido)
- Argumento a utilizar: $ARGUMENTS

## Comportamiento

Este comando ejecutar� los siguientes pasos:

1. **An�lisis de Contexto**: Lee la documentaci�n de arquitectura en `/Users/pablonunezruiz/repos/proyectos-propios/fantasync-pwa/.claude/ARCHITECTURE.md` para entender el contexto t�cnico del proyecto

2. **Invocaci�n del Agente**: Utiliza el agente `nextjs-architect` definido en `/Users/pablonunezruiz/repos/proyectos-propios/fantasync-pwa/.claude/agents/nextjs-architect.md` para:
   - Analizar los requisitos de la funcionalidad
   - Identificar componentes y servicios afectados
   - Definir el alcance t�cnico
   - Crear un plan de implementaci�n detallado

3. **Generaci�n del PRP**: Crea un nuevo archivo markdown en `/Users/pablonunezruiz/repos/proyectos-propios/fantasync-pwa/.claude/PRPs/not-started/` con el siguiente formato:
   - Nombre del archivo: `PRP-{timestamp}-{feature-slug}.md`
   - Contenido estructurado con todos los requisitos y especificaciones

## Estructura del PRP Generado

El documento PRP generado incluir�:

```markdown
# PRP: [Nombre de la Funcionalidad]

## Estado
- **Status**: not-started
- **Creado**: [fecha]
- **Prioridad**: [alta/media/baja]

## Resumen Ejecutivo
[Descripci�n breve de la funcionalidad]

## Requisitos Funcionales
- [Lista de requisitos funcionales]

## Requisitos T�cnicos

### Stack Tecnol�gico
- Next.js 15.5.2 con App Router
- Supabase (Auth, Database, Realtime, Storage)
- React 19 + TypeScript 5
- Tailwind CSS 4 + shadcn/ui
- Zustand + React Query

### Componentes Afectados
- [Lista de componentes a crear/modificar]

### Servicios de Supabase
- [Auth, RLS policies, Realtime channels, Storage buckets, Edge Functions]

### Modelos de Datos
- [Esquemas Prisma y tablas afectadas]

## Plan de Implementaci�n

### Fase 1: Setup y Configuraci�n
- [ ] [Tareas de configuraci�n]

### Fase 2: Desarrollo Backend
- [ ] [Tareas de backend/Supabase]

### Fase 3: Desarrollo Frontend
- [ ] [Tareas de UI/UX]

### Fase 4: Testing y Validaci�n
- [ ] [Tareas de testing]

## Consideraciones de Seguridad
- [RLS policies necesarias]
- [Validaciones requeridas]

## Criterios de Aceptaci�n
- [ ] [Lista de criterios verificables]

## Estimaci�n
- **Esfuerzo**: [horas/d�as]
- **Complejidad**: [baja/media/alta]

## Dependencias
- [Otros PRPs o funcionalidades requeridas]

## Notas de Implementaci�n
[Consideraciones t�cnicas espec�ficas basadas en ARCHITECTURE.md]
```

## Ejemplos de Uso

### Ejemplo 1: Sistema de Notificaciones
```
/create-prp Implementar sistema de notificaciones push para avisar a los jugadores cuando es su turno en una partida
```

Generar�: `PRP-20250830-notificaciones-push.md`

### Ejemplo 2: Chat Privado
```
/create-prp A�adir funcionalidad de chat privado entre jugadores con drawer lateral y persistencia en Supabase
```

Generar�: `PRP-20250830-chat-privado.md`

### Ejemplo 3: Sistema de Dados
```
/create-prp Crear sistema de tiradas de dados con animaciones 3D y registro en base de datos
```

Generar�: `PRP-20250830-sistema-dados.md`

## Flujo de Trabajo

1. **Creaci�n**: El PRP se crea en la carpeta `not-started`
2. **Inicio**: Cuando se comienza el desarrollo, mover a `in-progress`
3. **Revisi�n**: Una vez completado, mover a `completed`
4. **Archivo**: PRPs antiguos pueden moverse a una carpeta `archived`

## Integraci�n con el Flujo de Desarrollo

Los PRPs generados sirven como:
- **Especificaci�n t�cnica** para el desarrollo
- **Checklist** de implementaci�n
- **Documentaci�n** del proceso
- **Referencia** para testing y QA

## Notas Importantes

- El agente nextjs-architect analizar� autom�ticamente la arquitectura actual del proyecto
- Se considerar�n las mejores pr�cticas de Next.js 15 y Supabase
- Se incluir�n consideraciones de performance y escalabilidad
- Se respetar�n los patrones establecidos en ARCHITECTURE.md
- Se generar�n pol�ticas RLS apropiadas para Supabase

## Comando de Implementaci�n

Despu�s de crear el PRP, puedes usar:
```
/implement-prp [nombre-del-archivo-prp]
```

Para que el agente nextjs-architect comience la implementaci�n bas�ndose en el PRP generado.