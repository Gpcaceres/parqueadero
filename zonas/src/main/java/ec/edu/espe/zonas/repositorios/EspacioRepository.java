package ec.edu.espe.zonas.repositorios;

import ec.edu.espe.zonas.entidades.Espacio;
import ec.edu.espe.zonas.entidades.EstadoEspacio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EspacioRepository extends JpaRepository<Espacio, UUID> {

    // Verifica si un espacio existe por su código
    boolean existsByCodigo(String codigo);

    // Busca todos los espacios que pertenecen a una zona específica
    List<Espacio> findByZonaId(UUID idZona);

    // Busca espacios por zona y estado específico
    List<Espacio> findByZonaIdAndEstadoEspacio(UUID idZona, EstadoEspacio estadoEspacio);

    // Busca todos los espacios por estado
    List<Espacio> findByEstadoEspacio(EstadoEspacio estadoEspacio);

    // Cuenta cuántos espacios están OCUPADOS en una zona específica
    long countByZonaIdAndEstadoEspacio(UUID idZona, EstadoEspacio estadoEspacio);

    // Verifica si existe al menos un espacio ocupado en la zona
    boolean existsByZonaIdAndEstadoEspacio(UUID idZona, EstadoEspacio estadoEspacio);
}