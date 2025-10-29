# Ejemplos Avanzados de JOINs con Prisma

Esta carpeta contiene ejemplos complejos y avanzados de JOINs usando SQL directo con Prisma (`$queryRaw`). Todos los ejemplos incluyen consultas con **3 o más tablas** y casos de uso del mundo real.

## 📁 Archivos Disponibles

### [01-inner-join-avanzado.md](./01-inner-join-avanzado.md)
**INNER JOIN - Solo registros con coincidencia**

Ejemplos incluidos:
- Usuarios que compraron productos de una categoría específica (5 tablas)
- Productos más vendidos con detalles completos (5 tablas)
- Reporte de ventas por categoría y usuario (6 tablas)
- Análisis de comportamiento de compra (6 tablas)

**Casos de uso**: Reportes de ventas, análisis de productos, segmentación de clientes, métricas de negocio activas.

---

### [02-left-join-avanzado.md](./02-left-join-avanzado.md)
**LEFT JOIN - TODOS los registros principales + secundarios relacionados**

Ejemplos incluidos:
- Reporte completo de clientes con actividad (5 tablas)
- Dashboard de productos con métricas (4 tablas)
- Análisis de categorías con penetración de mercado (5 tablas)
- Reporte de tendencias temporales con CTEs (5 tablas)

**Casos de uso**: Dashboards completos, reportes ejecutivos, análisis de cobertura, KPIs de actividad, identificar inactividad.

---

### [03-right-join-avanzado.md](./03-right-join-avanzado.md)
**RIGHT JOIN - TODOS los registros secundarios + principales relacionados**

Ejemplos incluidos:
- Auditoría de integridad completa (todas las órdenes) (5 tablas)
- Productos y sus órdenes (incluso nunca vendidos) (5 tablas)
- Reviews con productos eliminados (4 tablas)
- Migración - Asignar cliente por defecto (con transacción) (3 tablas)

**Casos de uso**: Auditorías de integridad, detección de registros huérfanos, limpieza de base de datos, migraciones seguras.

---

### [04-full-join-avanzado.md](./04-full-join-avanzado.md)
**FULL OUTER JOIN - TODOS los registros de ambas tablas**

Ejemplos incluidos:
- Auditoría 360° completa del sistema (6 tablas)
- Reconciliación entre sistemas (migración de datos) (múltiples CTEs)
- Dashboard ejecutivo con métricas de calidad (5 tablas)
- Plan de acción automatizado con CTEs (5 tablas)
- Análisis temporal con ventanas (Window Functions) (4 tablas)

**Casos de uso**: Auditorías exhaustivas, reconciliación contable, migraciones de datos, dashboards ejecutivos, análisis de calidad de datos.

---

## 🎯 Guía de Selección Rápida

### ¿Qué JOIN usar según tu necesidad?

```
┌─────────────────────────────────────────────────────────────┐
│  ¿Necesitas SOLO registros con relaciones válidas?          │
│  → INNER JOIN (01-inner-join-avanzado.md)                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ¿Necesitas TODOS los usuarios/clientes/principales?        │
│  (incluso sin órdenes/compras/secundarios)                  │
│  → LEFT JOIN (02-left-join-avanzado.md)                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ¿Necesitas TODAS las órdenes/productos/secundarios?        │
│  (incluso sin cliente/categoría/principal)                  │
│  → RIGHT JOIN (03-right-join-avanzado.md)                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ¿Necesitas VER TODO, detectar TODO problema?               │
│  (auditoría completa, no perder ningún registro)            │
│  → FULL OUTER JOIN (04-full-join-avanzado.md)               │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Características Comunes

Todos los ejemplos incluyen:

✅ **Consultas SQL directas** con `$queryRaw`
✅ **Mínimo 3 tablas** por ejemplo (hasta 6)
✅ **Agregaciones complejas** (SUM, COUNT, AVG, GROUP BY)
✅ **Window Functions** (LAG, AVG OVER, etc.)
✅ **CTEs** (Common Table Expressions) para organización
✅ **CASE WHEN** para clasificaciones dinámicas
✅ **STRING_AGG** para concatenar valores
✅ **COALESCE** para manejar valores NULL
✅ **Comentarios detallados** en español
✅ **Ejemplos de resultado** esperado

## 📊 Comparación Visual

| JOIN | Clientes sin órdenes | Órdenes sin cliente | Productos nunca vendidos | Uso típico |
|------|---------------------|---------------------|--------------------------|------------|
| **INNER** | ❌ No | ❌ No | ❌ No | Reportes de ventas activas |
| **LEFT** | ✅ Sí | ❌ No | ✅ Sí (si partimos de Product) | Dashboards de usuarios |
| **RIGHT** | ❌ No | ✅ Sí | ✅ Sí (si apuntamos a Product) | Auditoría de órdenes |
| **FULL** | ✅ Sí | ✅ Sí | ✅ Sí | Auditoría completa 360° |

## 💡 Tips Generales para Queries Avanzadas

### 1. Usa índices en campos de JOIN
```prisma
@@index([userId])
@@index([productId])
@@index([categoryId])
```

### 2. COALESCE para valores por defecto
```sql
COALESCE(SUM(o.total), 0) AS total_ventas
COALESCE(u.name, 'Usuario desconocido') AS nombre
```

### 3. NULLS LAST para ordenamiento
```sql
ORDER BY total_ventas DESC NULLS LAST
```

### 4. STRING_AGG para concatenar
```sql
STRING_AGG(DISTINCT c.name, ', ') AS categorias
```

### 5. CASE WHEN para clasificaciones
```sql
CASE
  WHEN COUNT(o.id) >= 10 THEN 'VIP'
  WHEN COUNT(o.id) >= 5 THEN 'Frecuente'
  ELSE 'Nuevo'
END AS tipo_cliente
```

### 6. CTEs para organizar queries complejas
```sql
WITH ventas AS (...),
     productos AS (...),
     categorias AS (...)
SELECT * FROM ventas
JOIN productos ON ...
```

### 7. Window Functions para análisis temporal
```sql
LAG(ingresos) OVER (ORDER BY mes) AS mes_anterior,
AVG(ingresos) OVER (ORDER BY mes ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS promedio_movil
```

## 🎓 Recomendaciones de Aprendizaje

### Nivel Principiante
Empieza con: **01-inner-join-avanzado.md**
- Conceptos más simples
- Solo datos válidos
- Ejemplos más directos

### Nivel Intermedio
Continúa con: **02-left-join-avanzado.md**
- Manejo de NULLs
- Agregaciones con COALESCE
- Dashboards completos

### Nivel Avanzado
Explora: **03-right-join-avanzado.md**
- Auditorías de integridad
- Detección de problemas
- Migraciones seguras

### Nivel Experto
Domina: **04-full-join-avanzado.md**
- CTEs complejos
- Window Functions
- Reconciliación de sistemas
- Planes de acción automatizados

## 🔗 Enlaces Relacionados

- [Documentación básica de JOINs](../README.md)
- [Conceptos de JOINs](../00-concepto-joins.md)
- [INNER JOIN básico](../01-inner-join.md)
- [LEFT JOIN básico](../02-left-join.md)
- [RIGHT JOIN básico](../03-right-join.md)
- [FULL JOIN básico](../04-full-join.md)

## ⚠️ Notas Importantes

1. **SQLite NO soporta FULL OUTER JOIN**
   - Si usas SQLite, necesitas combinar LEFT + RIGHT manualmente
   - PostgreSQL, MySQL 8+, SQL Server sí lo soportan

2. **Performance**
   - Estas queries son complejas y pueden ser lentas en datasets grandes
   - Usa índices apropiados
   - Considera paginación para resultados grandes

3. **Type Safety**
   - `$queryRaw` no tiene tipado automático
   - Considera usar `$queryRaw<TipoEsperado>` para tipado manual

4. **Transacciones**
   - Para operaciones de escritura, usa `$transaction`
   - Ver ejemplos en 03-right-join-avanzado.md

## 📚 Recursos Adicionales

- [Prisma Documentation - Raw Queries](https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access)
- [PostgreSQL JOIN Documentation](https://www.postgresql.org/docs/current/queries-table-expressions.html#QUERIES-JOIN)
- [SQL Window Functions](https://www.postgresql.org/docs/current/tutorial-window.html)

---

**Creado para el curso de NestJS + Microservicios**
*Todos los ejemplos en español con casos de uso reales*
